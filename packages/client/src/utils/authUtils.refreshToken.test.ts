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
import { vi, Mock } from 'vitest'

// vi.mock is hoisted, so the mock function must be created with vi.hoisted.
const { invalidateToken } = vi.hoisted(() => ({ invalidateToken: vi.fn() }))

// Overrides the simpler authApi mock from setupTests so calls can be inspected.
vi.mock('@client/utils/authApi', () => ({
  authApi: { invalidateToken }
}))
vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

import { refreshToken } from '@client/utils/authUtils'

/** Unsigned JWT: jwt-decode only reads the payload, it does not verify it. */
function makeToken(expiresInSeconds: number, sub = 'user-1') {
  const encode = (value: object) =>
    btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  return `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ sub, exp })}.sig`
}

/** Simple in-memory localStorage so the real read/write order can be checked. */
function createLocalStorage() {
  const data = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    removeItem: vi.fn((key: string) => void data.delete(key)),
    clear: vi.fn(() => data.clear())
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('refreshToken', () => {
  let storage: ReturnType<typeof createLocalStorage>
  let fetchMock: Mock

  beforeEach(() => {
    storage = createLocalStorage()
    vi.stubGlobal('localStorage', storage)
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    invalidateToken.mockReset()
    invalidateToken.mockResolvedValue(undefined)
    window.history.replaceState({}, '', '/')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).config = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(window as any).config,
      AUTH_URL: 'http://localhost:4040/'
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does nothing while the token has plenty of time left', async () => {
    storage.setItem('opencrvs', makeToken(7 * 24 * 60 * 60))

    await expect(refreshToken()).resolves.toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('stores the new token and invalidates only the old one', async () => {
    const oldToken = makeToken(60) // 1 minute left: inside the 10 minute window
    const newToken = makeToken(7 * 24 * 60 * 60, 'user-1')
    storage.setItem('opencrvs', oldToken)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: newToken }), { status: 200 })
    )

    await expect(refreshToken()).resolves.toBe(true)

    expect(storage.getItem('opencrvs')).toBe(newToken)
    expect(invalidateToken).toHaveBeenCalledWith(oldToken)
    expect(invalidateToken).not.toHaveBeenCalledWith(newToken)
    expect(storage.removeItem).not.toHaveBeenCalled()
  })

  it('keeps the new token even when invalidating the old one finishes later (race regression)', async () => {
    const oldToken = makeToken(60)
    const newToken = makeToken(7 * 24 * 60 * 60)
    storage.setItem('opencrvs', oldToken)
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: newToken }), { status: 200 })
    )
    // Slow auth service: invalidation completes after refreshToken stored the new token
    invalidateToken.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 20))
    )

    await refreshToken()
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Before the fix, removeToken() finished here and deleted the new token
    expect(storage.getItem('opencrvs')).toBe(newToken)
  })

  it('keeps the new token when invalidating the old one fails', async () => {
    const newToken = makeToken(7 * 24 * 60 * 60)
    storage.setItem('opencrvs', makeToken(60))
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: newToken }), { status: 200 })
    )
    invalidateToken.mockRejectedValue(new Error('auth unavailable'))

    await expect(refreshToken()).resolves.toBe(true)
    await flush()
    expect(storage.getItem('opencrvs')).toBe(newToken)
  })

  it('returns false when the auth service refuses to refresh', async () => {
    const oldToken = makeToken(60)
    storage.setItem('opencrvs', oldToken)
    fetchMock.mockResolvedValue(new Response('Unauthorized', { status: 401 }))

    await expect(refreshToken()).resolves.toBe(false)
    expect(storage.getItem('opencrvs')).toBe(oldToken)
    expect(invalidateToken).not.toHaveBeenCalled()
  })

  it('keeps the session when the refresh request cannot reach the server', async () => {
    const oldToken = makeToken(60)
    storage.setItem('opencrvs', oldToken)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(refreshToken()).resolves.toBe(true)
    expect(storage.getItem('opencrvs')).toBe(oldToken)
    expect(invalidateToken).not.toHaveBeenCalled()
  })
})
