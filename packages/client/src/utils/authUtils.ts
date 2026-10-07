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
import decode from 'jwt-decode'
import * as Sentry from '@sentry/react'
import { TOKEN_EXPIRE_MILLIS } from './constants'
import { authApi } from '@client/utils/authApi'
import { ITokenPayload } from '@opencrvs/commons/client'

export const isTokenStillValid = (decoded: ITokenPayload) => {
  return Number(decoded.exp) * 1000 > Date.now()
}

export function getToken(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('token') || localStorage.getItem('opencrvs') || ''
}

export function storeToken(token: string) {
  localStorage.setItem('opencrvs', token)
}

export async function removeToken() {
  const token = getToken()
  if (token) {
    try {
      await authApi.invalidateToken(token)
    } catch (err) {
      Sentry.captureException(err)
    }
  }
  localStorage.removeItem('opencrvs')
}

export const getTokenPayload = (token: string) => {
  if (!token) {
    return null
  }
  let decoded: ITokenPayload
  try {
    decoded = decode(token)
  } catch (err) {
    Sentry.captureException(err)
    return null
  }

  return decoded
}

function isTokenAboutToExpire(token: string) {
  const payload = token && getTokenPayload(token)
  const payloadExpMillis = Number(payload && payload.exp) * 1000
  return payloadExpMillis - Date.now() <= TOKEN_EXPIRE_MILLIS
}

export async function refreshToken() {
  const oldToken = getToken()
  if (!isTokenAboutToExpire(oldToken)) {
    return true
  }

  const refreshUrl = new URL('refreshToken', window.config.AUTH_URL)
  let res: Response
  try {
    res = await fetch(refreshUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: oldToken
      })
    })
  } catch (err) {
    // Network error: we could not ask for a new token. Keep the current
    // session and try again on the next check instead of logging the user out.
    Sentry.captureException(err)
    return true
  }

  if (!res.ok) {
    return false
  }

  const data = await res.json()

  // Save the new token FIRST.
  // Previously this called removeToken() without awaiting it and then stored the
  // new token. removeToken() finished later and deleted the NEW token from
  // localStorage, so every request got 401 until the user was logged out.
  storeToken(data.token)

  // Then invalidate the old token on the server only. Do not call removeToken()
  // here: it also clears localStorage, which now holds the new token.
  try {
    await authApi.invalidateToken(oldToken)
  } catch (err) {
    Sentry.captureException(err)
  }

  return true
}
