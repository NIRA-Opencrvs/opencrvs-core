/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import { TRPCClientError } from '@trpc/client'
import { vi } from 'vitest'
import {
  backoff,
  getHttpStatus,
  isPermanentFailure,
  retryUnlessPermanentFailure,
  SESSION_EXPIRED_EVENT
} from './retryPolicy'

/** Builds the same kind of error tRPC gives us for an HTTP error response. */
function trpcError(httpStatus: number) {
  return TRPCClientError.from({
    error: {
      message: `HTTP ${httpStatus}`,
      code: -32000,
      data: { httpStatus, code: 'ERROR' }
    }
  })
}

describe('retryPolicy', () => {
  describe('getHttpStatus', () => {
    it('reads the status from a tRPC error', () => {
      expect(getHttpStatus(trpcError(409))).toBe(409)
    })

    it('reads the status from an Error whose cause is the status code', () => {
      expect(
        getHttpStatus(new Error('File upload failed', { cause: 400 }))
      ).toBe(400)
    })

    it('returns undefined for network errors', () => {
      expect(getHttpStatus(new TypeError('Failed to fetch'))).toBeUndefined()
      expect(
        getHttpStatus(TRPCClientError.from(new TypeError('Failed to fetch')))
      ).toBeUndefined()
    })

    it('returns undefined for anything that is not an error', () => {
      expect(getHttpStatus(undefined)).toBeUndefined()
      expect(getHttpStatus('boom')).toBeUndefined()
    })
  })

  describe('isPermanentFailure', () => {
    it.each([400, 401, 403, 404, 409, 413, 422])(
      'treats HTTP %i as permanent',
      (status) => {
        expect(isPermanentFailure(trpcError(status))).toBe(true)
      }
    )

    it.each([408, 429, 500, 502, 503, 504])(
      'treats HTTP %i as temporary',
      (status) => {
        expect(isPermanentFailure(trpcError(status))).toBe(false)
      }
    )

    it('treats network errors as temporary (offline support)', () => {
      expect(isPermanentFailure(new TypeError('Failed to fetch'))).toBe(false)
    })
  })

  describe('retryUnlessPermanentFailure', () => {
    let listener: ReturnType<typeof vi.fn>

    beforeEach(() => {
      listener = vi.fn()
      window.addEventListener(SESSION_EXPIRED_EVENT, listener)
    })

    afterEach(() => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
    })

    it('stops retrying on 401 and reports the expired session', () => {
      expect(retryUnlessPermanentFailure(0, trpcError(401))).toBe(false)
      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('stops retrying on 409 without reporting a session problem', () => {
      expect(retryUnlessPermanentFailure(0, trpcError(409))).toBe(false)
      expect(listener).not.toHaveBeenCalled()
    })

    it('stops retrying an empty upload (400 carried in Error.cause)', () => {
      expect(
        retryUnlessPermanentFailure(
          0,
          new Error('File upload failed', { cause: 400 })
        )
      ).toBe(false)
    })

    it('keeps retrying server errors, however many attempts were made', () => {
      expect(retryUnlessPermanentFailure(0, trpcError(503))).toBe(true)
      expect(retryUnlessPermanentFailure(500, trpcError(500))).toBe(true)
    })

    it('keeps retrying network errors', () => {
      expect(
        retryUnlessPermanentFailure(3, new TypeError('Failed to fetch'))
      ).toBe(true)
    })
  })

  describe('backoff', () => {
    it('starts at the base delay and doubles', () => {
      const delay = backoff(3333)
      expect(delay(0)).toBe(3333)
      expect(delay(1)).toBe(6666)
      expect(delay(2)).toBe(13332)
    })

    it('never exceeds the default ceiling of 60 seconds', () => {
      const delay = backoff(3333)
      expect(delay(10)).toBe(60_000)
      expect(delay(1000)).toBe(60_000)
    })

    it('respects a custom ceiling', () => {
      expect(backoff(1000, 5000)(10)).toBe(5000)
    })
  })
})
