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
/*
 * Regression tests for the retry storm seen in production:
 * event.create (401), event.draft.create (409) and /upload (400) were retried
 * forever every few seconds. These tests read the mutation defaults that the
 * app registers at import time and check the retry decision for each error.
 */
import { TRPCClientError } from '@trpc/client'
import { toast } from 'react-hot-toast'
import { vi } from 'vitest'
import { queryClient, trpcOptionsProxy } from '@client/v2-events/trpc'
import '@client/v2-events/features/events/useEvents/procedures/create'
import '@client/v2-events/features/events/useEvents/procedures/delete'
import '@client/v2-events/features/drafts/useDrafts'
import { UPLOAD_MUTATION_KEY } from '@client/v2-events/features/files/useFileUpload'
import {
  retryDelay as actionRetryDelay,
  retryUnlessConflict
} from '@client/v2-events/features/events/useEvents/procedures/actions/action'

function trpcError(httpStatus: number) {
  return TRPCClientError.from({
    error: {
      message: `HTTP ${httpStatus}`,
      code: -32000,
      data: { httpStatus, code: 'ERROR' }
    }
  })
}

const networkError = () => TRPCClientError.from(new TypeError('Failed to fetch'))

type RetryFn = (failureCount: number, error: unknown) => boolean
type DelayFn = (failureCount: number, error: unknown) => number

function defaultsFor(mutationKey: readonly unknown[]) {
  const defaults = queryClient.getMutationDefaults(mutationKey)
  if (
    typeof defaults.retry !== 'function' ||
    typeof defaults.retryDelay !== 'function'
  ) {
    throw new Error(
      `Expected retry and retryDelay functions for ${JSON.stringify(mutationKey)}`
    )
  }
  return {
    retry: defaults.retry as RetryFn,
    retryDelay: defaults.retryDelay as DelayFn
  }
}

describe('v2 mutation retry defaults', () => {
  describe('event.create', () => {
    const { retry, retryDelay } = defaultsFor(
      trpcOptionsProxy.event.create.mutationKey()
    )

    it('does not retry an expired session (401)', () => {
      expect(retry(0, trpcError(401))).toBe(false)
    })

    it.each([400, 403, 409])('does not retry HTTP %i', (status) => {
      expect(retry(0, trpcError(status))).toBe(false)
    })

    it('keeps retrying server and network errors (offline outbox)', () => {
      expect(retry(0, trpcError(500))).toBe(true)
      expect(retry(100, trpcError(503))).toBe(true)
      expect(retry(100, networkError())).toBe(true)
    })

    it('backs off from 3.3s up to 60s', () => {
      expect(retryDelay(0, networkError())).toBe(3333)
      expect(retryDelay(1, networkError())).toBe(6666)
      expect(retryDelay(20, networkError())).toBe(60_000)
    })
  })

  describe('event.draft.create', () => {
    const { retry, retryDelay } = defaultsFor(
      trpcOptionsProxy.event.draft.create.mutationKey()
    )

    it('does not retry "You are not assigned to this event" (409)', () => {
      expect(retry(0, trpcError(409))).toBe(false)
    })

    it('does not retry an expired session (401)', () => {
      expect(retry(0, trpcError(401))).toBe(false)
    })

    it('keeps retrying server and network errors', () => {
      expect(retry(5, trpcError(502))).toBe(true)
      expect(retry(5, networkError())).toBe(true)
    })

    it('backs off from 10s up to 60s', () => {
      expect(retryDelay(0, networkError())).toBe(10_000)
      expect(retryDelay(1, networkError())).toBe(20_000)
      expect(retryDelay(10, networkError())).toBe(60_000)
    })
  })

  describe('event.delete', () => {
    const { retry, retryDelay } = defaultsFor(
      trpcOptionsProxy.event.delete.mutationKey()
    )

    it.each([400, 404])('still does not retry HTTP %i', (status) => {
      expect(retry(0, trpcError(status))).toBe(false)
    })

    it.each([401, 409])('no longer retries HTTP %i forever', (status) => {
      expect(retry(0, trpcError(status))).toBe(false)
    })

    it('keeps retrying server and network errors', () => {
      expect(retry(3, trpcError(500))).toBe(true)
      expect(retry(3, networkError())).toBe(true)
    })

    it('backs off from 10s up to 60s', () => {
      expect(retryDelay(0, networkError())).toBe(10_000)
      expect(retryDelay(10, networkError())).toBe(60_000)
    })
  })

  describe('file upload', () => {
    const { retry, retryDelay } = defaultsFor([UPLOAD_MUTATION_KEY])

    it('does not retry an empty upload rejected with 400', () => {
      expect(retry(0, new Error('File upload failed', { cause: 400 }))).toBe(
        false
      )
    })

    it('does not retry an expired session (401)', () => {
      expect(retry(0, new Error('File upload failed', { cause: 401 }))).toBe(
        false
      )
    })

    it('keeps retrying server errors and network failures', () => {
      expect(retry(3, new Error('File upload failed', { cause: 503 }))).toBe(
        true
      )
      expect(retry(3, new TypeError('Failed to fetch'))).toBe(true)
    })

    it('backs off from 5s up to 60s', () => {
      expect(retryDelay(0, new TypeError('Failed to fetch'))).toBe(5000)
      expect(retryDelay(20, new TypeError('Failed to fetch'))).toBe(60_000)
    })
  })

  describe('actions (declare, validate, register, ...)', () => {
    it('does not retry a conflict (409), as before', () => {
      expect(retryUnlessConflict(0, trpcError(409))).toBe(false)
    })

    it.each([400, 401, 403, 404])(
      'no longer retries HTTP %i forever',
      (status) => {
        expect(retryUnlessConflict(0, trpcError(status))).toBe(false)
      }
    )

    it('keeps retrying server and network errors', () => {
      expect(retryUnlessConflict(0, trpcError(500))).toBe(true)
      expect(retryUnlessConflict(3, networkError())).toBe(true)
    })

    it('still shows the "Something went wrong" toast on the 11th failure', () => {
      const toastError = vi.spyOn(toast, 'error')
      retryUnlessConflict(10, trpcError(500))
      expect(toastError).toHaveBeenCalled()
      toastError.mockRestore()
    })

    it('keeps the 10s minimum and caps the delay at 5 minutes', () => {
      expect(actionRetryDelay(0)).toBe(10_000)
      expect(actionRetryDelay(4)).toBe(16_000)
      expect(actionRetryDelay(8)).toBe(256_000)
      expect(actionRetryDelay(9)).toBe(300_000) // was 512s
      expect(actionRetryDelay(15)).toBe(300_000) // was over 9 hours
    })
  })
})
