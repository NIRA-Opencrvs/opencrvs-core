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
import { createTRPCClient, TRPCClientError, type TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { vi } from 'vitest'
import { SESSION_EXPIRED_EVENT } from './retryPolicy'
import { sessionExpiryLink } from './sessionExpiryLink'

/** A terminating link that answers every call with the given HTTP status. */
function respondWith(httpStatus: number | null): TRPCLink<any> {
  return () => () =>
    observable((observer) => {
      if (httpStatus === null) {
        observer.next({ result: { type: 'data', data: 'ok' } })
        observer.complete()
        return
      }
      observer.error(
        TRPCClientError.from({
          error: {
            message: `HTTP ${httpStatus}`,
            code: -32000,
            data: { httpStatus, code: 'ERROR' }
          }
        })
      )
    })
}

function clientAnswering(httpStatus: number | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createTRPCClient<any>({
    links: [sessionExpiryLink as TRPCLink<any>, respondWith(httpStatus)]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any
}

describe('sessionExpiryLink', () => {
  let listener: ReturnType<typeof vi.fn>

  beforeEach(() => {
    listener = vi.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  afterEach(() => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  it('reports an expired session on 401 and still passes the error on', async () => {
    const client = clientAnswering(401)

    await expect(client.event.create.mutate({})).rejects.toMatchObject({
      data: { httpStatus: 401 }
    })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it.each([400, 403, 409, 500])(
    'does not report an expired session on %i',
    async (status) => {
      const client = clientAnswering(status)

      await expect(client.event.create.mutate({})).rejects.toBeInstanceOf(
        TRPCClientError
      )
      expect(listener).not.toHaveBeenCalled()
    }
  )

  it('lets successful responses through untouched', async () => {
    const client = clientAnswering(null)

    await expect(client.user.get.query()).resolves.toBe('ok')
    expect(listener).not.toHaveBeenCalled()
  })
})
