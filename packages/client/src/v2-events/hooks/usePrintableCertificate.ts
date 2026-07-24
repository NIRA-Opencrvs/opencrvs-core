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

import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { cloneDeep } from 'lodash'
import QRCode from 'qrcode'
import {
  ActionDocument,
  ActionType,
  CertificateTemplateConfig,
  EventConfig,
  EventDocument,
  EventState,
  FieldType,
  getAcceptedActions,
  getCurrentEventState,
  isMinioUrl,
  LanguageConfig,
  Location,
  PrintCertificateAction,
  UserOrSystem
} from '@opencrvs/commons/client'
import {
  addFontsToSvg,
  compileSvg,
  printAndDownloadPdf,
  svgToPdfTemplate
} from '@client/v2-events/features/events/actions/print-certificate/pdfUtils'
import { fetchImageAsBase64 } from '@client/utils/imageUtils'
import { getOfflineData } from '@client/offline/selectors'
import { useEventConfiguration } from '../features/events/useEventConfiguration'
import { hasStringFilename } from '../utils'

/**
 * Builds the compact JSON payload embedded directly in the certificate's QR
 * code. The QR is fully self-contained (no server lookup needed).
 */
function buildQrPayload(
  eventType: string,
  metadata: {
    trackingId?: string
    legalStatuses?: {
      REGISTERED?: { registrationNumber?: string } | null
    }
  },
  declaration: EventState
) {
  const isDeathEvent = eventType === 'death'
  const namePrefix = isDeathEvent ? 'deceased' : 'child'

  const name = declaration[`${namePrefix}.name`] as
    | { firstname?: string; middlename?: string; surname?: string }
    | undefined

  const dob = declaration[`${namePrefix}.dob`] as string | undefined

  const registrationNumberLabel = isDeathEvent ? 'DRN' : 'BRN'
  const dateLabel = isDeathEvent ? 'Date of Death' : 'Date of Birth'

  return [
    `Tracking Number: ${metadata.trackingId ?? ''}`,
    `${registrationNumberLabel}: ${
      metadata.legalStatuses?.REGISTERED?.registrationNumber ?? ''
    }`,
    `Surname: ${name?.surname ?? ''}`,
    `First Name: ${name?.firstname ?? ''}`,
    `Other Names: ${name?.middlename ?? ''}`,
    `${dateLabel}: ${dob ?? ''}`
  ].join('\n')
}

async function replaceMinioUrlWithBase64(
  declaration: EventState,
  config: EventConfig
) {
  // Clone to avoid mutating the original declaration
  const declarationClone = cloneDeep(declaration)

  const fileFieldIds = config.declaration.pages
    .flatMap((page) => page.fields)
    .filter((field) => field.type === FieldType.FILE)
    .map((field) => field.id)

  for (const fieldId of fileFieldIds) {
    const field = declarationClone[fieldId]

    if (hasStringFilename(field) && isMinioUrl(field.filename)) {
      // TypeScript now knows `field` has a `filename` property of type string
      field.filename = await fetchImageAsBase64(field.filename)
    }
  }

  return declarationClone
}

export const usePrintableCertificate = ({
  event,
  config,
  locations,
  users,
  certificateConfig,
  language
}: {
  event: EventDocument
  config: EventConfig
  locations: Location[]
  users: UserOrSystem[]
  certificateConfig?: CertificateTemplateConfig
  language?: LanguageConfig
}) => {
  const { eventConfiguration } = useEventConfiguration(event.type)
  const { config: appConfig } = useSelector(getOfflineData)
  const { declaration, ...metadata } = getCurrentEventState(
    event,
    eventConfiguration
  )
  const copiesPrintedForTemplate = event.actions.filter(
    (action) =>
      action.type === ActionType.PRINT_CERTIFICATE &&
      (action as PrintCertificateAction).content?.templateId ===
        certificateConfig?.id
  ).length

  const modifiedMetadata = {
    ...metadata,
    // Temporarily add `modifiedAt` to the last action's data to display
    // the current certification date in the certificate preview on the review page.
    modifiedAt: new Date().toISOString(),
    // Since 'modifiedDate' represents the last action's 'createdAt' date, and when
    // we actually print certificate, in this particular case, last action is PRINT_CERTIFICATE
    copiesPrintedForTemplate
  }

  const [previewQrCode, setPreviewQrCode] = useState<string>()

  useEffect(() => {
    let cancelled = false

    if (!metadata.legalStatuses?.REGISTERED) {
      setPreviewQrCode(undefined)
      return
    }

    QRCode.toDataURL(buildQrPayload(event.type, metadata, declaration), {
      width: 200,
      margin: 1
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setPreviewQrCode(dataUrl)
        }
      })
      .catch(() => {
        // Non-fatal: certificate preview still renders without a QR code.
      })
    return () => {
      cancelled = true
    }
  }, [
    event.type,
    event.id,
    metadata.legalStatuses?.REGISTERED?.registrationNumber
  ])

  if (!language || !certificateConfig?.svg) {
    return { svgCode: null }
  }

  const adminLevels = appConfig.ADMIN_STRUCTURE

  const certificateFonts = certificateConfig.fonts ?? {}

  const svgWithoutFonts = compileSvg({
    templateString: certificateConfig.svg,
    $metadata: modifiedMetadata,
    $declaration: declaration,
    $actions: getAcceptedActions(event),
    review: true,
    locations,
    users,
    language,
    config,
    adminLevels,
    qrCode: previewQrCode
  })

  const svgCode = addFontsToSvg(svgWithoutFonts, certificateFonts)

  /**
   * NOTE: We have separated the preparing and printing of the PDF certificate. Without the separation, user is already unassigned from the event and cache is cleared. We end up losing the images in the PDF unless we run actions in correct order.
   * 1. Prepare 2. Trigger print action 3. Open the PDF in a new window 4. Redirect user to workqueue.
   *
   * Prepares the PDF certificate by resolving image urls to base64 and compiles them into SVG template.
   * @returns function that opens a new window with the PDF certificate
   */
  const preparePdfCertificate = async (updatedEvent: EventDocument) => {
    const { declaration: updatedDeclaration, ...updatedMetadata } =
      getCurrentEventState(updatedEvent, eventConfiguration)
    const declarationWithResolvedImages = await replaceMinioUrlWithBase64(
      updatedDeclaration,
      config
    )

    const qrCode = await QRCode.toDataURL(
      buildQrPayload(updatedEvent.type, updatedMetadata, updatedDeclaration),
      {
        width: 200,
        margin: 1
      }
    )

    const compiledSvg = compileSvg({
      templateString: certificateConfig.svg,
      qrCode,
      $metadata: {
        ...updatedMetadata,
        // Temporarily add `modifiedAt` to the last action's data to display
        // the current certification date in the certificate preview on the review page.
        modifiedAt: new Date().toISOString(),
        copiesPrintedForTemplate
      },
      $declaration: declarationWithResolvedImages,
      $actions: event.actions as ActionDocument[],
      locations,
      review: false,
      users,
      language,
      config,
      adminLevels
    })

    const compiledSvgWithFonts = addFontsToSvg(compiledSvg, certificateFonts)
    const pdfTemplate = await svgToPdfTemplate(
      compiledSvgWithFonts,
      certificateFonts
    )

    return () => printAndDownloadPdf(pdfTemplate, event.id)
  }

  return {
    svgCode,
    preparePdfCertificate
  }
}
