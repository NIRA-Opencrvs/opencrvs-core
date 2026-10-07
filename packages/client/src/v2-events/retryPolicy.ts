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

/** Shared helpers for v2 mutation retries. */

/** Window event fired when the server rejects the session (HTTP 401). */
export const SESSION_EXPIRED_EVENT = 'opencrvs:session-expired'

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

/** Tells the app shell that the session is no longer valid. */
export function notifySessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

/**
 * `retry` option that always retries, and reports an expired session on 401.
 * Only needed for requests that do not go through tRPC's sessionExpiryLink.
 */
export function retryAndReportExpiredSession(
  _failureCount: number,
  error: unknown
): boolean {
  if (getHttpStatus(error) === 401) {
    notifySessionExpired()
  }
  return true
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
