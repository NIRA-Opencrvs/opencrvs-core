/* eslint-disable react/jsx-no-literals */
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { ResponsiveModal, Button } from '@opencrvs/components'
import { getAcceptedActions, UUID } from '@opencrvs/commons/client'
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

export function PrintAdoptionScheduleModal({
  eventId,
  close
}: {
  eventId: UUID
  close: (result?: boolean) => void
}) {
  const event = useEvents().getEvent.getFromCache(eventId)
  const { eventConfiguration } = useEventConfiguration(event.type)
  const { certificateTemplates, language } = useAppConfig()
  const [locations] = useLocations().getLocations.useSuspenseQuery()
  const [users] = useUsers().getUsers.useSuspenseQuery(
    getUserIdsFromActions(getAcceptedActions(event))
  )
  const certificateConfig = certificateTemplates.find(
    (t) => t.id === 'adoption-schedule'
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

  const print = async () => {
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
    try {
      const printPdf = await preparePdfCertificate(event)
      printPdf(printWindow)
      close()
    } catch (error) {
      printWindow?.close()
      toast.error(
        'The adoption schedule could not be prepared. Please try again.'
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
        <Button key="cancel" type="tertiary" onClick={() => close()}>
          Cancel
        </Button>,
        <Button key="print" disabled={pending} type="primary" onClick={print}>
          Print Adoption Schedule
        </Button>
      ]}
      contentHeight={120}
      handleClose={() => close()}
      id="print-adoption-schedule-modal"
      show={true}
      title="Print Adoption Schedule"
    >
      The issued adoption schedule will be opened for printing.
    </ResponsiveModal>
  )
}
