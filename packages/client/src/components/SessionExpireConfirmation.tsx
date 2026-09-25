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
import { connect } from 'react-redux'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import { ResponsiveModal } from '@opencrvs/components/lib/ResponsiveModal'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { IStoreState } from '@client/store'
import { redirectToAuthentication } from '@client/profile/profileActions'
import { showSessionExpireConfirmation } from '@client/notification/actions'
import { SESSION_EXPIRED_EVENT } from '@client/v2-events/retryPolicy'
import { messages } from '@client/i18n/messages/views/session'
import { buttonMessages } from '@client/i18n/messages'

type SessionExpireProps = {
  sessionExpired: boolean
}
interface IProps {
  redirectToAuthentication: typeof redirectToAuthentication
  showSessionExpireConfirmation: typeof showSessionExpireConfirmation
}

const SessionExpireComponent = ({
  intl,
  sessionExpired,
  redirectToAuthentication,
  showSessionExpireConfirmation
}: SessionExpireProps & IProps & IntlShapeProps) => {
  // v2 (tRPC) requests report a 401 through a window event, because they have
  // no access to the redux store. Show the same dialog as for GraphQL 401s.
  React.useEffect(() => {
    const onSessionExpired = () => showSessionExpireConfirmation()
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
  }, [showSessionExpireConfirmation])

  if (!sessionExpired) {
    return null
  }
  return (
    <ResponsiveModal
      title={intl.formatMessage(messages.sessionExpireTxt)}
      contentHeight={96}
      responsive={false}
      actions={[
        <PrimaryButton
          key="login"
          id="login"
          onClick={() => redirectToAuthentication(true)}
        >
          {intl.formatMessage(buttonMessages.login)}
        </PrimaryButton>
      ]}
      show={true}
    />
  )
}

const mapStateToProps = (store: IStoreState) => {
  return {
    sessionExpired: store.notification.sessionExpired
  }
}

export const SessionExpireConfirmation = connect<
  SessionExpireProps,
  IProps,
  SessionExpireProps & IProps,
  IStoreState
>(mapStateToProps, {
  redirectToAuthentication,
  showSessionExpireConfirmation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
})(injectIntl(SessionExpireComponent)) as any
