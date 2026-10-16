/* eslint-disable react/jsx-no-literals */
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { ResponsiveModal, Button } from '@opencrvs/components'
import { getAcceptedActions, getUUID, UUID } from '@opencrvs/commons/client'
import { useAppConfig } from '@client/v2-events/hooks/useAppConfig'
import { useEvents } from '@client/v2-events/features/events/useEvents/useEvents'
import { useEventConfiguration } from '@client/v2-events/features/events/useEventConfiguration'
import { usePrintableCertificate } from '@client/v2-events/hooks/usePrintableCertificate'
import { useUsers } from '@client/v2-events/hooks/useUsers'
import { useLocations } from '@client/v2-events/hooks/useLocations'
import { getUserIdsFromActions } from '@client/v2-events/utils'
import { isMobileDevice } from '@client/utils/commonUtils'

function showPreparingSchedule(printWindow: Window) {
  const { document } = printWindow
  document.title = 'Preparing adoption schedule…'
  document.body.replaceChildren()
  document.body.style.cssText =
    'display: grid; min-height: 100vh; margin: 0; place-items: center; font: 18px sans-serif; color: #222;'

  const status = document.createElement('p')
  status.textContent = 'Preparing adoption schedule…'
  document.body.append(status)
}

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
    const printWindow = isMobileDevice()
      ? undefined
      : (window.open('', '_blank') ?? undefined)
    if (!isMobileDevice() && !printWindow) {
      toast.error(
        'Browser permission is required to print the certificate. Please allow the required browser permission and try again.'
      )
      return
    }

    if (printWindow) {
      showPreparingSchedule(printWindow)
    }

    setPending(true)
    let scheduleIssued = false
    try {
      const issuedEvent =
        await events.actions.issueAdoptionSchedule.mutateAsync({
          eventId,
          transactionId: getUUID(),
          declaration: {},
          annotation: {}
        })
      scheduleIssued = true
      const print = await preparePdfCertificate(issuedEvent)
      print(printWindow)
      close(true)
    } catch (error) {
      printWindow?.close()
      toast.error(
        scheduleIssued
          ? 'The adoption schedule was issued, but could not be prepared for printing. Please use Print Adoption Schedule to try again.'
          : 'The adoption schedule could not be issued. Please try again.'
      )
      // eslint-disable-next-line no-console
      console.error(error)
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
