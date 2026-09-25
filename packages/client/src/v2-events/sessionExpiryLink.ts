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
import type { AppRouter } from '@gateway/v2-events/events/router'
import type { TRPCLink } from '@trpc/client'
import { observable } from '@trpc/server/observable'
import { notifySessionExpired } from '@client/v2-events/retryPolicy'

/**
 * Shows the "Session expired" dialog whenever the events API answers 401,
 * the same way the GraphQL client already does. Without this, tRPC calls
 * failed silently with 401 and the user was never asked to log in again.
 *
 * The error is passed on unchanged, so callers and retry logic still see it.
 */
export const sessionExpiryLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) =>
    observable((observer) => {
      const subscription = next(op).subscribe({
        next: (value) => observer.next(value),
        error: (error) => {
          if (error.data?.httpStatus === 401) {
            notifySessionExpired()
          }
          observer.error(error)
        },
        complete: () => observer.complete()
      })
      return () => subscription.unsubscribe()
    })
}
