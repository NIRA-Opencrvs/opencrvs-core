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
import { z } from 'zod'
import {
  ActionBase,
  ActionDocument,
  getAssignedUserFromActions,
  isActionInScope,
  logger,
  Scope,
  TokenUserType
} from '@opencrvs/commons'
import {
  ActionType,
  ActionInputWithType,
  EventConfig,
  EventDocument,
  RegisterActionInput
} from '@opencrvs/commons/events'
import { TokenWithBearer } from '@opencrvs/commons/authentication'
import { getEventById } from '@events/service/events/events'
import { getUserRoleScopeMapping } from '@events/service/config/config'
import { getUser } from '@events/service/users/api'
import { TrpcUserContext } from '@events/context'

const REGISTER_CONFIRMATION_SCHEMA = z.object({
  registrationNumber: z.string()
})

/** Revoked states; 'pending' is a normal pre-first-login state, so it passes. */
const REVOKED_USER_STATUS = {
  deactivated: 'deactivated',
  disabled: 'disabled'
} as const

/**
 * Whether to resume the REGISTER the client was chaining when the VALIDATE was
 * deferred. Intent is derived from the requester's *current* register scope,
 * which is exactly the rule `useReviewActionConfig` uses to chain it.
 *
 * @NOTE If a client path ever lets a register-scoped human validate WITHOUT
 * chaining a REGISTER, this must become an explicit intent flag on the input.
 * Must run before the accept, which can release the assignment it depends on.
 */
export async function planRegisterContinuation({
  event,
  requestedAction,
  token
}: {
  event: EventDocument
  /** The Requested action being confirmed. */
  requestedAction: Pick<
    ActionBase,
    'id' | 'transactionId' | 'createdBy' | 'createdByUserType'
  >
  token: TokenWithBearer
}): Promise<{ requesterId: string; transactionId: string } | undefined> {
  const context = { eventId: event.id, actionId: requestedAction.id }

  // A system integration may hold a register scope without intending to register.
  if (requestedAction.createdByUserType !== TokenUserType.enum.user) {
    return undefined
  }

  if (event.actions.some(({ type }) => type === ActionType.REGISTER)) {
    logger.debug(context, 'Deferred REGISTER continuation not applicable')
    return undefined
  }

  const assignedTo = getAssignedUserFromActions(
    event.actions.filter(
      (action): action is ActionDocument =>
        action.type === ActionType.ASSIGN || action.type === ActionType.UNASSIGN
    )
  )

  if (assignedTo !== requestedAction.createdBy) {
    logger.info(
      context,
      'Deferred REGISTER continuation skipped: record is no longer assigned to original registrar'
    )
    return undefined
  }

  let role: string
  let scopes: Scope[]

  try {
    const requester = await getUser(requestedAction.createdBy, token)

    if (
      requester.status === REVOKED_USER_STATUS.deactivated ||
      requester.status === REVOKED_USER_STATUS.disabled
    ) {
      logger.info(
        { ...context, status: requester.status },
        'Deferred REGISTER continuation skipped: user account is no longer active'
      )
      return undefined
    }

    // Users have no scopes; the role does. Same resolution the auth service uses.
    role = requester.role
    scopes = (await getUserRoleScopeMapping())[role] ?? []
  } catch (error) {
    // A lookup failure must never break the accepted VALIDATE.
    logger.error(
      { ...context, error },
      'Deferred REGISTER continuation skipped: could not resolve the current permissions of the requester'
    )
    return undefined
  }

  const hasRegisterScope = isActionInScope(
    scopes,
    ActionType.REGISTER,
    event.type
  )

  logger.info(
    {
      ...context,
      createdBy: requestedAction.createdBy,
      createdByUserType: requestedAction.createdByUserType,
      role,
      assignedTo,
      hasRegisterScope,
      shouldResume: hasRegisterScope
    },
    'Deferred REGISTER continuation evaluated'
  )

  if (!hasRegisterScope) {
    logger.info(
      { ...context, role },
      'Deferred REGISTER continuation skipped: role does not grant permission to register this event type'
    )
    return undefined
  }

  return {
    requesterId: requestedAction.createdBy,
    transactionId: requestedAction.transactionId
  }
}

/**
 * Goes through the ordinary request handler, so availability, duplicate
 * detection and confirmation behave as for a browser-sent REGISTER.
 */
export async function resumeRegister({
  requestHandler,
  event,
  continuation,
  user,
  token,
  configuration
}: {
  requestHandler: (
    actionInput: ActionInputWithType,
    actingUser: TrpcUserContext,
    bearer: TokenWithBearer,
    target: EventDocument,
    eventConfig: EventConfig,
    responseSchema?: z.ZodObject<z.ZodRawShape>
  ) => Promise<unknown>
  event: EventDocument
  continuation: { requesterId: string; transactionId: string }
  user: TrpcUserContext
  token: TokenWithBearer
  configuration: EventConfig
}): Promise<EventDocument> {
  const context = { eventId: event.id, requesterId: continuation.requesterId }

  try {
    logger.info(context, 'Deferred VALIDATE accepted; resuming REGISTER')

    await requestHandler(
      RegisterActionInput.parse({
        eventId: event.id,
        // Derived from the original chain: one transaction id, one action type.
        transactionId: `${continuation.transactionId}-register-continuation`,
        declaration: {}
      }),
      user,
      token,
      event,
      configuration,
      REGISTER_CONFIRMATION_SCHEMA
    )

    return await getEventById(event.id)
  } catch (error) {
    logger.error(
      { ...context, error },
      'Deferred REGISTER continuation failed; record left validated for manual registration'
    )

    return event
  }
}
