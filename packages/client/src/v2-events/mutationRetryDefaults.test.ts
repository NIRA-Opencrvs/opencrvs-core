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
 * These tests read the mutation defaults that the app registers at import
 * time and check the retry decision and the delay between attempts.
 */
import { TRPCClientError } from '@trpc/client'
import { toast } from 'react-hot-toast'
import { vi } from 'vitest'
import { queryClient, trpcOptionsProxy } from '@client/v2-events/trpc'
import '@client/v2-events/features/events/useEvents/procedures/create'
import '@client/v2-events/features/events/useEvents/procedures/delete'
import '@client/v2-events/features/drafts/useDrafts'
import { UPLOAD_MUTATION_KEY } from '@client/v2-events/features/files/useFileUpload'
import { SESSION_EXPIRED_EVENT } from '@client/v2-events/retryPolicy'
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

type DelayFn = (failureCount: number, error: unknown) => number

function defaultsFor(mutationKey: readonly unknown[]) {
  const defaults = queryClient.getMutationDefaults(mutationKey)
  if (typeof defaults.retryDelay !== 'function') {
    throw new Error(
      `Expected a retryDelay function for ${JSON.stringify(mutationKey)}`
    )
  }
  return {
    retry: defaults.retry,
    retryDelay: defaults.retryDelay as DelayFn
  }
}

describe('v2 mutation retry defaults', () => {
  describe('event.create', () => {
    const { retry, retryDelay } = defaultsFor(
      trpcOptionsProxy.event.create.mutationKey()
    )

    it('retries every error', () => {
      expect(retry).toBe(true)
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

    it('retries every error', () => {
      expect(retry).toBe(true)
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

    if (typeof retry !== 'function') {
      throw new Error('Expected a retry function for event.delete')
    }

    it.each([400, 404])('does not retry HTTP %i', (status) => {
      expect(retry(0, trpcError(status))).toBe(false)
    })

    it.each([401, 403, 409, 500])('retries HTTP %i', (status) => {
      expect(retry(0, trpcError(status))).toBe(true)
    })

    it('retries network errors', () => {
      expect(retry(3, networkError())).toBe(true)
    })

    it('backs off from 10s up to 60s', () => {
      expect(retryDelay(0, networkError())).toBe(10_000)
      expect(retryDelay(10, networkError())).toBe(60_000)
    })
  })

  describe('file upload', () => {
    const { retry, retryDelay } = defaultsFor([UPLOAD_MUTATION_KEY])
    const uploadError = (status: number) =>
      new Error('File upload failed', { cause: status })

    if (typeof retry !== 'function') {
      throw new Error('Expected a retry function for file upload')
    }

    it.each([400, 401, 409, 503])('retries HTTP %i', (status) => {
      expect(retry(0, uploadError(status))).toBe(true)
    })

    it('retries network failures', () => {
      expect(retry(3, new TypeError('Failed to fetch'))).toBe(true)
    })

    it('reports an expired session on 401 only', () => {
      const listener = vi.fn()
      window.addEventListener(SESSION_EXPIRED_EVENT, listener)
      retry(0, uploadError(400))
      retry(0, new TypeError('Failed to fetch'))
      expect(listener).not.toHaveBeenCalled()
      retry(0, uploadError(401))
      expect(listener).toHaveBeenCalledTimes(1)
      window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
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

    it.each([400, 401, 403, 404, 413, 422])(
      'keeps retrying HTTP %i',
      (status) => {
        expect(retryUnlessConflict(0, trpcError(status))).toBe(true)
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
