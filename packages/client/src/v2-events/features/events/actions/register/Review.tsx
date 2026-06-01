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
  Review as ReviewComponent
} from '@client/v2-events/features/events/components/Review'
import { useModal } from '@client/v2-events/hooks/useModal'
import { useEventFormNavigation } from '@client/v2-events/features/events/useEventFormNavigation'
import { useEventConfiguration } from '@client/v2-events/features/events/useEventConfiguration'
import { useEventFormData } from '@client/v2-events/features/events/useEventFormData'
import { useActionAnnotation } from '@client/v2-events/features/events/useActionAnnotation'
import { FormLayout } from '@client/v2-events/layouts'
import { useDrafts } from '@client/v2-events/features/drafts/useDrafts'
import { validationErrorsInActionFormExist } from '@client/v2-events/components/forms/validation'
import { useSaveAndExitModal } from '@client/v2-events/components/SaveAndExitModal'
import { useIntlFormatMessageWithFlattenedParams } from '@client/v2-events/messages/utils'
import { makeFormFieldIdFormikCompatible } from '@client/v2-events/components/forms/utils'
import { useValidatorContext } from '@client/v2-events/hooks/useValidatorContext'
import { getUserDetails } from '@client/profile/profileSelectors'
import { reviewMessages } from '../messages'

function getTranslations(hasErrors: boolean) {
  const state = hasErrors ? 'incomplete' : ('complete' as const)

  return reviewMessages[state].register
}

/**
 *
 * Preview of event to be registered.
 */
export function Review() {
  const { eventId } = useTypedParams(ROUTES.V2.EVENTS.REGISTER)
  const [{ workqueue: slug }] = useTypedSearchParams(
    ROUTES.V2.EVENTS.VALIDATE.REVIEW
  )
  const events = useEvents()
  const drafts = useDrafts()
  const [modal, openModal] = useModal()
  const navigate = useNavigate()
  const { closeActionView: closeActionView } = useEventFormNavigation()
  const { saveAndExitModal, handleSaveAndExit } = useSaveAndExitModal()
  const { formatMessage } = useIntlFormatMessageWithFlattenedParams()

  const registerMutation = events.actions.register

  const event = events.getEvent.getFromCache(eventId)
  const validatorContext = useValidatorContext(event)

  const legacyUser = useSelector(getUserDetails)

  const previousAnnotation = getActionAnnotation({
    event,
    actionType: ActionType.REGISTER
  })

  const { setAnnotation, getAnnotation } = useActionAnnotation()
  const annotation = getAnnotation(previousAnnotation)

  const { eventConfiguration: config } = useEventConfiguration(event.type)

  const formConfig = getDeclaration(config)
  const reviewConfig = getActionReview(config, ActionType.REGISTER)

  const getFormValues = useEventFormData((state) => state.getFormValues)
  const currentEventState = getCurrentEventState(event, config)
  const previousFormValues = currentEventState.declaration
  const form = getFormValues()

  const creationAction = event.actions.find(
    (action) => action.type === ActionType.CREATE
  )

  const createdByHFA =
    creationAction?.createdByRole === 'HEALTH_FACILITY_ADMINISTRATOR'
  const currentUserIsHFA =
    legacyUser?.role.id === 'HEALTH_FACILITY_ADMINISTRATOR'

  const ESCALATE_ROLES = [
    'REGISTRATION_OFFICER',
    'CID_OFFICER',
    'LEGAL_OFFICER',
    'COMMISSIONER_CIVIL_REGISTRATION',
    'SENIOR_REGISTRAR_OFFICER'
  ]

  const isEscalatedRecord =
    !!currentEventState.declaration?.['review.escalationRole']

  const showEscalateButton =
    ESCALATE_ROLES.includes(legacyUser?.role?.id ?? '') &&
    currentEventState.status !== EventStatus.enum.REGISTERED

  const APPROVAL_ROLES = [
    'CID_OFFICER',
    'LEGAL_OFFICER',
    'SENIOR_REGISTRAR_OFFICER'
  ]

  const ESCALATION_ONLY_ROLES = ['CID_OFFICER', 'LEGAL_OFFICER']

  const isApprovalOfficer = APPROVAL_ROLES.includes(legacyUser?.role?.id ?? '')

  const isEscalationOnlyOfficer = ESCALATION_ONLY_ROLES.includes(
    legacyUser?.role?.id ?? ''
  )
  const escalationAssignedToCurrentUser =
    currentEventState.declaration?.['review.escalationRole'] ===
    legacyUser?.role?.id

  const incomplete = validationErrorsInActionFormExist({
    formConfig,
    form,
    context: validatorContext,
    annotation,
    reviewFields: reviewConfig.fields
  })

  const messages = getTranslations(incomplete)

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
        ROUTES.V2.EVENTS.REGISTER.PAGES.buildPath(
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

  async function handleRegistration() {
    const confirmedRegistration = await openModal<boolean | null>((close) => {
      if (messages.modal === undefined) {
        // eslint-disable-next-line no-console
        console.error(
          'Tried to render register modal without message definitions.'
        )
        return
      }

      return (
        <ReviewComponent.ActionModal.Accept
          action="Register"
          close={close}
          copy={{ ...messages.modal, eventLabel: config.label }}
        />
      )
    })
    if (confirmedRegistration) {
      registerMutation.mutate({
        eventId,
        declaration: isEscalatedRecord
          ? {
              ...form,
              'review.escalated': false,
              'review.escalationRole': '',
              'review.escalationComment': ''
            }
          : form,
        transactionId: uuid(),
        annotation
      })
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
          legacyUser?.role?.id as EscalationState['escalationRole']
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
    const assignedTo =
      currentEventState.declaration?.['review.escalatedFromUserId']

    if (!assignedTo || typeof assignedTo !== 'string') {
      return
    }

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
        reason: 'Escalation approved'
      }
    })

    closeActionView(slug)
  }

  return (
    <FormLayout
      route={ROUTES.V2.EVENTS.REGISTER}
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
          icon="Check"
          incomplete={incomplete}
          messages={{
            ...messages,

            onApproveEscalation: {
              id: 'buttons.approve',
              defaultMessage: 'Approve Escalation',
              description: 'Approve escalated record'
            }
          }}
          primaryButtonType="positive"
          onConfirm={isEscalationOnlyOfficer ? undefined : handleRegistration}
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
