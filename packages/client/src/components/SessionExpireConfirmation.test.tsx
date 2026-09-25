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
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { SessionExpireConfirmation } from '@client/components/SessionExpireConfirmation'
import { SESSION_EXPIRED_EVENT } from '@client/v2-events/retryPolicy'
import {
  createTestComponent,
  createTestStore,
  flushPromises
} from '@client/tests/util'

describe('SessionExpireConfirmation', () => {
  it('is hidden until the session expires', async () => {
    const { store } = await createTestStore()
    const { component } = await createTestComponent(
      <SessionExpireConfirmation />,
      { store }
    )

    expect(store.getState().notification.sessionExpired).toBe(false)
    expect(component.find('#login').hostNodes()).toHaveLength(0)
  })

  it('opens the dialog when a v2 (tRPC) request reports a 401', async () => {
    const { store } = await createTestStore()
    const { component } = await createTestComponent(
      <SessionExpireConfirmation />,
      { store }
    )
    await flushPromises()

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    })
    component.update()

    expect(store.getState().notification.sessionExpired).toBe(true)
    expect(component.find('#login').hostNodes()).toHaveLength(1)
  })

  it('stops listening once unmounted', async () => {
    const { store } = await createTestStore()
    const { component } = await createTestComponent(
      <SessionExpireConfirmation />,
      { store }
    )
    await flushPromises()
    component.unmount()

    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))

    expect(store.getState().notification.sessionExpired).toBe(false)
  })
})
