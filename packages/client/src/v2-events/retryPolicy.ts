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

/**
 * Shared retry policy for v2 mutations.
 *
 * Offline-first behaviour is kept: network failures and server errors (5xx)
 * are still retried without a limit, so declarations made offline are sent
 * once the connection or the server comes back.
 *
 * What changes: errors that will fail the same way on every attempt are no
 * longer retried, and the gap between attempts grows up to a ceiling instead
 * of staying at a few seconds forever.
 */

/** Window event fired when the server rejects the session (HTTP 401). */
export const SESSION_EXPIRED_EVENT = 'opencrvs:session-expired'

/**
 * HTTP statuses that can never succeed by simply sending the same request again:
 * 400 bad request, 401 not logged in, 403 not allowed, 404 not found,
 * 409 conflict (e.g. not assigned), 413 too large, 422 invalid data.
 */
const PERMANENT_FAILURE_STATUSES = new Set([400, 401, 403, 404, 409, 413, 422])

/** Default ceiling for the gap between two attempts. */
const MAX_RETRY_DELAY_MS = 60_000

/**
 * Reads the HTTP status from a tRPC error, or from a plain Error whose
 * `cause` is the status code (as thrown by the file upload/delete helpers).
 * Returns undefined for network errors, which have no status.
 */
export function getHttpStatus(error: unknown): number | undefined {
  if (error instanceof TRPCClientError) {
    const status = error.data?.httpStatus
    return typeof status === 'number' ? status : undefined
  }
  if (error instanceof Error && typeof error.cause === 'number') {
    return error.cause
  }
  return undefined
}

export function isPermanentFailure(error: unknown): boolean {
  const status = getHttpStatus(error)
  return status !== undefined && PERMANENT_FAILURE_STATUSES.has(status)
}

/** Tells the app shell that the session is no longer valid. */
export function notifySessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

/**
 * `retry` option for mutations: keep retrying network and server errors,
 * stop immediately on permanent failures.
 */
export function retryUnlessPermanentFailure(
  _failureCount: number,
  error: unknown
): boolean {
  if (getHttpStatus(error) === 401) {
    notifySessionExpired()
  }
  return !isPermanentFailure(error)
}

/**
 * `retryDelay` option: exponential backoff starting at `baseMs`,
 * doubling each attempt, never longer than `maxMs`.
 * e.g. backoff(3333) → 3.3s, 6.7s, 13s, 27s, 53s, 60s, 60s, ...
 */
export function backoff(baseMs: number, maxMs = MAX_RETRY_DELAY_MS) {
  return (failureCount: number) =>
    Math.min(maxMs, Math.max(baseMs, baseMs * 2 ** failureCount))
}
