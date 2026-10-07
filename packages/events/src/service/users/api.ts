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

import http from 'http'
import https from 'https'
import fetch from 'node-fetch'
import {
  joinUrl,
  FullDocumentPath,
  UUID,
  IUserName,
  UserOrSystem,
  TokenUserType,
  logger,
  SystemRole
} from '@opencrvs/commons'
import { env } from '@events/environment'

/**
 * Every tRPC request resolves the caller through user-mgnt (see context.ts), so this
 * client sits on the hot path of the whole events service.
 *
 * - Keep-alive agents avoid opening a new TCP connection (through the Swarm VIP) for
 *   every call.
 * - An explicit timeout stops a stuck connection from hanging the request forever.
 * - One retry on connection-level failures covers stale keep-alive sockets
 *   (ECONNRESET / "socket hang up") and transient overlay-network problems.
 *   getUser/getSystem are read-only, so retrying is safe.
 */
const USER_MGNT_TIMEOUT_MS = Number(process.env.USER_MGNT_TIMEOUT_MS) || 5000
const USER_MGNT_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.USER_MGNT_MAX_ATTEMPTS) || 2
)

const keepAliveOptions = {
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10
}
const httpAgent = new http.Agent(keepAliveOptions)
const httpsAgent = new https.Agent(keepAliveOptions)
const agentFor = (url: URL) => (url.protocol === 'https:' ? httpsAgent : httpAgent)

const RETRYABLE_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ETIMEDOUT',
  'EAI_AGAIN'
])

function isRetryable(error: unknown): boolean {
  const { type, code } = (error ?? {}) as { type?: string; code?: string }
  return (
    type === 'request-timeout' ||
    (typeof code === 'string' && RETRYABLE_ERROR_CODES.has(code))
  )
}

async function postToUserManagement(
  endpoint: 'getUser' | 'getSystem',
  payload: Record<string, string>,
  token: string
) {
  const url = joinUrl(env.USER_MANAGEMENT_URL, endpoint).href

  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        agent: agentFor,
        timeout: USER_MGNT_TIMEOUT_MS
      })
    } catch (error) {
      if (attempt >= USER_MGNT_MAX_ATTEMPTS || !isRetryable(error)) {
        throw error
      }
      logger.warn(
        `user-mgnt ${endpoint} attempt ${attempt}/${USER_MGNT_MAX_ATTEMPTS} failed: ${
          error instanceof Error ? error.message : String(error)
        }. Retrying.`
      )
    }
  }
}

type UserAPIResult = {
  id: string
  avatar?: {
    data: FullDocumentPath
    type: string
  }
  signature?: FullDocumentPath
  device?: string
  name: IUserName[]
  username: string
  emailForNotification: string
  mobile: string
  role: string
  fullHonorificName?: string
  data?: Record<string, string>
  practitionerId: string
  primaryOfficeId: UUID
  scope: string[]
  status: string
  creationDate: number
}

export async function getUser(
  userId: string,
  token: string
): Promise<UserAPIResult> {
  const res = await postToUserManagement('getUser', { userId }, token)

  if (!res.ok) {
    throw new Error(
      `Unable to retrieve user details. Error: ${res.status} status received`
    )
  }

  return res.json() as Promise<UserAPIResult>
}

type SystemAPIResult = {
  name: string
  createdBy: string
  username: string
  client_id: string
  status: string
  scope: string[]
  sha_secret: string
  type: SystemRole
}

export async function getSystem(
  systemId: string,
  token: string
): Promise<SystemAPIResult> {
  const res = await postToUserManagement('getSystem', { systemId }, token)

  if (!res.ok) {
    throw new Error(
      `Unable to retrieve system details. Error: ${res.status} status received`
    )
  }

  return res.json() as Promise<SystemAPIResult>
}

export async function getUserOrSystem(
  id: string,
  token: string
): Promise<UserOrSystem | undefined> {
  try {
    const user = await getUser(id, token)

    return {
      type: TokenUserType.enum.user,
      id: user.id,
      name: user.name,
      role: user.role,
      signature: user.signature ? user.signature : undefined,
      avatar: user.avatar?.data ? user.avatar.data : undefined,
      primaryOfficeId: user.primaryOfficeId,
      device: user.device ? user.device : undefined,
      fullHonorificName: user.fullHonorificName
        ? user.fullHonorificName
        : undefined,
      data: user.data ? user.data : undefined,
      mobile: user.mobile,
      email: user.emailForNotification
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    logger.info(`No user found for id: ${id}. Will look for a system instead.`)
  }

  try {
    const system = await getSystem(id, token)

    return {
      type: TokenUserType.enum.system,
      id,
      name: system.name,
      role: system.type
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    logger.info(
      `No system found for id: ${id}. User/system has probably been removed. Will return undefined.`
    )
  }

  return
}
