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
import React from 'react'
import styled from 'styled-components'
import { useIntl } from 'react-intl'
import { Spinner } from '@opencrvs/components'
import { withSuspense } from '@client/v2-events/components/withSuspense'
import { WorkqueueLayout } from './workqueues'
import { EventOverviewLayout } from './EventOverview'
import { FormLayout } from './form'

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100vh;
`

const workqueueLayoutLoadingMessage = {
  id: 'workqueueLayout.loadingMessage',
  description: 'Message shown while the workqueue layout is loading',
  defaultMessage: 'Just a moment...'
}

function SuspendedWorkqueueLayout(
  props: React.ComponentProps<typeof WorkqueueLayout>
) {
  const intl = useIntl()
  return (
    <React.Suspense
      fallback={
        <SpinnerContainer>
          <Spinner id="workqueue-layout-spinner" />
          <span>{intl.formatMessage(workqueueLayoutLoadingMessage)}</span>
        </SpinnerContainer>
      }
    >
      <WorkqueueLayout {...props} />
    </React.Suspense>
  )
}

const SuspendedFormLayout = withSuspense(FormLayout)
const SuspendedEventOverviewLayout = withSuspense(EventOverviewLayout)

export {
  SuspendedWorkqueueLayout as WorkqueueLayout,
  SuspendedFormLayout as FormLayout,
  SuspendedEventOverviewLayout as EventOverviewLayout
}
