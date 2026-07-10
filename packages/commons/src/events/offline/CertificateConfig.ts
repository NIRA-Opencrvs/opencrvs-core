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
import { ShowConditional } from '../Conditional'
import { TranslationConfig } from '../TranslationConfig'

const FontFamily = z.object({
  normal: z.string(),
  bold: z.string(),
  italics: z.string(),
  bolditalics: z.string()
})
/**
 * Represents API response from country-config
 */
export const CertificateConfig = z.object({
  id: z.string(),
  event: z.string(),
  isV2Template: z.boolean().optional(),
  label: TranslationConfig,
  isDefault: z.boolean(),
  /**
   * Whether the `record.registered.print-certified-copies` scope is required to
   * receive this template. Defaults to `true` when omitted (backward compatible).
   * Set to `false` for templates that must be available without the print
   * permission, e.g. Notification Records printed from the declaration review page.
   */
  requiresPrintPermission: z.boolean().optional(),
  fee: z.object({
    onTime: z.number(),
    late: z.number(),
    delayed: z.number()
  }),
  svgUrl: z.string(),
  fonts: z.record(FontFamily).optional(),
  conditionals: z.array(ShowConditional).optional()
})

export type CertificateConfig = z.infer<typeof CertificateConfig>

/**
 * Represents the way client uses it
 */
export const CertificateTemplateConfig = CertificateConfig.extend({
  hash: z.string().optional(),
  svg: z.string()
})

export type CertificateTemplateConfig = z.infer<
  typeof CertificateTemplateConfig
>
