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

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import {
  useTypedParams,
  useTypedSearchParams
} from 'react-router-typesafe-routes/dom'
import { useSelector } from 'react-redux'
import {
  getCurrentEventState,
  ActionType,
  ActionStatus,
  EventStatus,
  getActionAnnotation,
  getDeclaration,
  getActionReview,
  InherentFlags
} from '@opencrvs/commons/client'
import { ROUTES } from '@client/v2-events/routes'
import { useEvents } from '@client/v2-events/features/events/useEvents/useEvents'
import {
  REJECT_ACTIONS,
  RejectionState,
  EscalationState,
  ESCALATION_OPTIONS_BY_ROLE,
  Review as ReviewComponent
} from '@client/v2-events/features/events/components/Review'
import { useModal } from '@client/v2-events/hooks/useModal'
import { useEventFormNavigation } from '@client/v2-events/features/events/useEventFormNavigation'
import { useEventConfiguration } from '@client/v2-events/features/events/useEventConfiguration'
import { useEventFormData } from '@client/v2-events/features/events/useEventFormData'
import { useActionAnnotation } from '@client/v2-events/features/events/useActionAnnotation'
import { FormLayout } from '@client/v2-events/layouts'
import { useDrafts } from '@client/v2-events/features/drafts/useDrafts'
import { useSaveAndExitModal } from '@client/v2-events/components/SaveAndExitModal'
import { useIntlFormatMessageWithFlattenedParams } from '@client/v2-events/messages/utils'
import { makeFormFieldIdFormikCompatible } from '@client/v2-events/components/forms/utils'
import { useValidatorContext } from '@client/v2-events/hooks/useValidatorContext'
import { getUserDetails } from '@client/profile/profileSelectors'
import { useReviewActionConfig } from './useReviewActionConfig'
import { conforms } from 'lodash'
import { configureScope } from '@sentry/react'
import { useUsers } from '@client/v2-events/hooks/useUsers'
import { useAuthentication } from '@client/utils/userUtils'

/**
 *
 * Preview of event to be validated.
 */
export function Review() {
  const { eventId } = useTypedParams(ROUTES.V2.EVENTS.VALIDATE)
  const [{ workqueue: slug }] = useTypedSearchParams(
    ROUTES.V2.EVENTS.VALIDATE.REVIEW
  )
  const events = useEvents()
  const drafts = useDrafts()
  const [modal, openModal] = useModal()
  const navigate = useNavigate()
  const { closeActionView } = useEventFormNavigation()

  const event = events.getEvent.findFromCache(eventId).data
  const validatorContext = useValidatorContext(event)

  useEffect(() => {
    if (!event) {
      // eslint-disable-next-line no-console
      console.warn(
        `Event with id ${eventId} not found in cache. Redirecting to overview.`
      )
      return navigate(ROUTES.V2.EVENTS.OVERVIEW.buildPath({ eventId }))
    }
  }, [event, eventId, navigate])

  if (!event) {
    return <div />
  }

  const { setAnnotation, getAnnotation } = useActionAnnotation()

  const { saveAndExitModal, handleSaveAndExit } = useSaveAndExitModal()

  const legacyUser = useSelector(getUserDetails)

  const previousAnnotation = getActionAnnotation({
    event,
    actionType: ActionType.VALIDATE
  })

  const annotation = getAnnotation(previousAnnotation)

  const { eventConfiguration: config } = useEventConfiguration(event.type)

  const formConfig = getDeclaration(config)
  const reviewConfig = getActionReview(config, ActionType.VALIDATE)
  const { formatMessage } = useIntlFormatMessageWithFlattenedParams()

  const getFormValues = useEventFormData((state) => state.getFormValues)

  const creationAction = event.actions.find(
    (action) => action.type === ActionType.CREATE
  )

  const createdByHFA =
    creationAction?.createdByRole === 'HEALTH_FACILITY_ADMINISTRATOR'
  const currentUserIsHFA =
    legacyUser?.role.id === 'HEALTH_FACILITY_ADMINISTRATOR'

  const currentEventState = getCurrentEventState(event, config)

  // Escalate button: only for these roles, only before REGISTERED state
  const ESCALATE_ROLES = [
    'REGISTRATION_OFFICER',
    'CID_OFFICER',
    'LEGAL_OFFICER',
    'COMMISSIONER_CIVIL_REGISTRATION_OFFICER',
    'SENIOR_REGISTRATION_OFFICER'
  ]

  // Notification queues where CID/Legal officer should be readonly and
  // should not see the Escalate button at all.
  const NOTIFICATION_QUEUE_SLUGS = [
    'in-review-all-birth-self',
    'in-review-all-birth',
    'in-review-all-death-self',
    'in-review-all-death'
  ]

  const isNotificationQueue = NOTIFICATION_QUEUE_SLUGS.includes(slug ?? '')

  const isCIDOrLegalOfficerUser = ['CID_OFFICER', 'LEGAL_OFFICER'].includes(
    legacyUser?.role?.id ?? ''
  )

  // Hide Escalate button when opened from Awaiting ID Update queue
  const isAwaitingIdQueue = slug === 'awaiting-id-update'

  const showEscalateButton =
    ESCALATE_ROLES.includes(legacyUser?.role?.id ?? '') &&
    currentEventState.status !== EventStatus.enum.REGISTERED &&
    !isAwaitingIdQueue &&
    !(isCIDOrLegalOfficerUser && isNotificationQueue)

  const APPROVAL_ROLES = ['CID_OFFICER', 'LEGAL_OFFICER']

  // This for Hide register & reject flow to this user only escalation feature
  const ESCALATION_ONLY_ROLES = ['CID_OFFICER', 'LEGAL_OFFICER']

  const isApprovalOfficer = APPROVAL_ROLES.includes(legacyUser?.role?.id ?? '')

  const isEscalationOnlyOfficer = ESCALATION_ONLY_ROLES.includes(
    legacyUser?.role?.id ?? ''
  )

  const isEscalatedRecord =
    !!currentEventState.declaration?.['review.escalationRole']

  const escalationAssignedToCurrentUser =
    currentEventState.declaration?.['review.escalationRole'] ===
    legacyUser?.role?.id

  const previousFormValues = currentEventState.declaration
  const form = getFormValues()

  const reviewActionConfiguration = useReviewActionConfig({
    formConfig,
    declaration: form,
    annotation,
    reviewFields: reviewConfig.fields,
    status: currentEventState.status,
    eventType: event.type,
    validatorContext
  })

  async function handleEdit({
    pageId,
    fieldId,
    confirmation
  }: {
    pageId: string
    fieldId?: string
    confirmation?: boolean
  }) {
    const confirmedEdit =
      confirmation ||
      (await openModal<boolean | null>((close) => (
        <ReviewComponent.EditModal close={close} />
      )))

    if (confirmedEdit) {
      navigate(
        ROUTES.V2.EVENTS.VALIDATE.PAGES.buildPath(
          { pageId, eventId },
          {
            from: 'review',
            workqueue: slug
          },
          fieldId ? makeFormFieldIdFormikCompatible(fieldId) : undefined
        )
      )
    }
    return
  }

  async function handleValidation() {
    const confirmedValidation = await openModal<boolean | null>((close) => {
      if (reviewActionConfiguration.messages.modal === undefined) {
        // eslint-disable-next-line no-console
        console.error(
          'Tried to render validate modal without message definitions.'
        )
        return null
      }

      return (
        <ReviewComponent.ActionModal.Accept
          action="Validate"
          close={close}
          copy={{
            ...reviewActionConfiguration.messages.modal,
            eventLabel: config.label
          }}
        />
      )
    })

    if (confirmedValidation) {
      reviewActionConfiguration.onConfirm(eventId)
      closeActionView(slug)
    }
  }

  async function handleRejection() {
    const confirmedRejection = await openModal<RejectionState | null>(
      (close) => <ReviewComponent.ActionModal.Reject close={close} />
    )
    if (confirmedRejection) {
      const { rejectAction, message, isDuplicate } = confirmedRejection

      if (rejectAction === REJECT_ACTIONS.SEND_FOR_UPDATE) {
        events.actions.reject.mutate({
          eventId,
          declaration: isEscalatedRecord
            ? {
                'review.escalated': false,
                'review.escalationRole': '',
                'review.escalationComment': ''
              }
            : {},
          transactionId: uuid(),
          annotation: {},
          content: { reason: message }
        })
      }

      if (rejectAction === REJECT_ACTIONS.ARCHIVE) {
        if (isDuplicate) {
          events.customActions.archiveOnDuplicate.mutate({
            eventId,
            declaration: isEscalatedRecord
              ? {
                  'review.escalated': false,
                  'review.escalationRole': '',
                  'review.escalationComment': ''
                }
              : {},
            transactionId: uuid(),
            content: { reason: message }
          })
        } else {
          events.actions.archive.mutate({
            eventId,
            declaration: isEscalatedRecord
              ? {
                  'review.escalated': false,
                  'review.escalationRole': '',
                  'review.escalationComment': ''
                }
              : {},
            transactionId: uuid(),
            annotation: {},
            content: { reason: message }
          })
        }
      }
      closeActionView(slug)
    }
  }

  async function handleEscalation() {
    const result = await openModal<EscalationState | null>((close) => (
      <ReviewComponent.ActionModal.Escalate
        close={close}
        currentUserRole={
          legacyUser?.role?.id as keyof typeof ESCALATION_OPTIONS_BY_ROLE
        }
      />
    ))

    if (!result) return
    events.actions.escalate.mutate({
      eventId,
      transactionId: uuid(),
      declaration: {
        'review.escalated': true,
        'review.escalationRole': result.escalationRole,
        'review.escalationComment': result.comment
      },
      annotation: {},
      content: {
        reason: result.comment
      }
    })

    closeActionView(slug)
  }

  async function handleEscalationApproval() {
    const result = await openModal<{ comment: string } | null>((close) => (
      <ReviewComponent.ActionModal.Approval close={close} />
    ))

    if (!result?.comment) return

    await events.actions.escalate.mutate({
      eventId,
      transactionId: uuid(),

      declaration: {
        'review.escalated': false,
        'review.escalationRole': '',
        'review.escalationComment': ''
      },

      annotation: {},

      content: {
        reason: result.comment
      }
    })

    closeActionView(slug)
  }

  return (
    <FormLayout
      route={ROUTES.V2.EVENTS.VALIDATE}
      onSaveAndExit={async () =>
        handleSaveAndExit(() => {
          drafts.submitLocalDraft()
          closeActionView(slug)
        })
      }
    >
      <ReviewComponent.Body
        annotation={annotation}
        form={form}
        formConfig={formConfig}
        previousFormValues={previousFormValues}
        readonlyMode={createdByHFA && !currentUserIsHFA}
        reviewFields={reviewConfig.fields}
        title={formatMessage(reviewConfig.title, form)}
        validatorContext={validatorContext}
        onAnnotationChange={(values) => setAnnotation(values)}
        onEdit={handleEdit}
      >
        <ReviewComponent.Actions
          icon={reviewActionConfiguration.icon}
          incomplete={reviewActionConfiguration.incomplete}
          messages={{
            ...reviewActionConfiguration.messages,

            onApproveEscalation: {
              id: 'buttons.approve',
              defaultMessage: 'Approve Escalation',
              description: 'Approve escalated record'
            }
          }}
          primaryButtonType={reviewActionConfiguration.buttonType}
          onConfirm={isEscalationOnlyOfficer ? undefined : handleValidation}
          onReject={
            isEscalationOnlyOfficer
              ? undefined
              : currentEventState.flags.includes(InherentFlags.REJECTED)
                ? undefined
                : handleRejection
          }
          onEscalate={showEscalateButton ? handleEscalation : undefined}
          onApproveEscalation={
            isEscalatedRecord &&
            isApprovalOfficer &&
            escalationAssignedToCurrentUser
              ? handleEscalationApproval
              : undefined
          }
        />
        {modal}
      </ReviewComponent.Body>
      {saveAndExitModal}
    </FormLayout>
  )
}
