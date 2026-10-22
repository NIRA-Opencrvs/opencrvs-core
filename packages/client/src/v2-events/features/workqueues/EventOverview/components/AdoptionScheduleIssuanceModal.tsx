/* eslint-disable react/jsx-no-literals */
import React, { useState } from 'react'
import { ResponsiveModal, Button } from '@opencrvs/components'
import { getAcceptedActions, getUUID, UUID } from '@opencrvs/commons/client'
import { useAppConfig } from '@client/v2-events/hooks/useAppConfig'
import { useEvents } from '@client/v2-events/features/events/useEvents/useEvents'
import { useEventConfiguration } from '@client/v2-events/features/events/useEventConfiguration'
import { usePrintableCertificate } from '@client/v2-events/hooks/usePrintableCertificate'
import { useUsers } from '@client/v2-events/hooks/useUsers'
import { useLocations } from '@client/v2-events/hooks/useLocations'
import { getUserIdsFromActions } from '@client/v2-events/utils'

export function AdoptionScheduleIssuanceModal({
  eventId,
  close
}: {
  eventId: UUID
  close: (result: boolean) => void
}) {
  const events = useEvents()
  const event = events.getEvent.getFromCache(eventId)
  const { eventConfiguration } = useEventConfiguration(event.type)
  const { certificateTemplates, language } = useAppConfig()
  const { getUsers } = useUsers()
  const { getLocations } = useLocations()
  const [locations] = getLocations.useSuspenseQuery()
  const actions = getAcceptedActions(event)
  const [users] = getUsers.useSuspenseQuery(getUserIdsFromActions(actions))
  const certificateConfig = certificateTemplates.find(
    (template) => template.id === 'adoption-schedule'
  )
  const { preparePdfCertificate } = usePrintableCertificate({
    event,
    config: eventConfiguration,
    locations,
    users,
    certificateConfig,
    language
  })
  const [pending, setPending] = useState(false)

  const issue = async () => {
    if (!certificateConfig || !preparePdfCertificate) {
      return
    }
    setPending(true)
    try {
      const print = await preparePdfCertificate(event)
      await events.actions.issueAdoptionSchedule.mutateAsync({
        eventId,
        transactionId: getUUID(),
        declaration: {},
        annotation: {}
      })
      print()
      close(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <ResponsiveModal
      actions={[
        <Button key="cancel" type="tertiary" onClick={() => close(false)}>
          Cancel
        </Button>,
        <Button key="issue" disabled={pending} type="primary" onClick={issue}>
          Issue and print schedule
        </Button>
      ]}
      contentHeight={120}
      handleClose={() => close(false)}
      id="issue-adoption-schedule-modal"
      show={true}
      title="Issue Adoption Schedule?"
    >
      The adoption schedule will be recorded as issued and opened for printing.
    </ResponsiveModal>
  )
}
