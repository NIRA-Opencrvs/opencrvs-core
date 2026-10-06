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
import { backoff, getHttpStatus } from './retryPolicy'

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
