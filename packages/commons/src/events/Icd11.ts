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

/**
 * Value stored for an `ICD11` field. We keep both the code and the
 * human-readable label because, unlike FACILITY/OFFICE/LOCATION, the full
 * ICD-11 code list is never synced to the client -- there is no local
 * dataset to resolve a code back to its label at render time.
 */
export const Icd11FieldValue = z.object({
  code: z.string(),
  label: z.string()
})
export type Icd11FieldValue = z.infer<typeof Icd11FieldValue>

export const Icd11FieldUpdateValue = z.object({
  code: z.string().optional(),
  label: z.string().optional()
})
export type Icd11FieldUpdateValue = z.infer<typeof Icd11FieldUpdateValue>

/** Shape of a single entry returned by the WHO ICD-11 search API. */
type Icd11DestinationEntity = {
  title?: string
  theCode?: string
  matchingPVs?: Array<{ label?: string }>
}

/**
 * Removes HTML markup and decodes the handful of HTML entities the WHO API
 * emits. The WHO search API wraps matched terms in `<em class='found'>...</em>`
 * highlighting tags -- these appear in BOTH the `title` field and
 * `matchingPVs[].label` when `highlightingEnabled` is on -- so any text taken
 * from the response has to be sanitised before being shown or stored.
 */
export function stripIcd11Html(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

/**
 * Extracts the readable disease label out of a WHO `matchingPVs[].label`
 * entry, e.g. `<em class='found'>SSS</em> - [sick sinus syndrome]` -> `sick
 * sinus syndrome`. Falls back to the tag-stripped string when there is no
 * bracketed segment to prefer.
 */
export function extractIcd11LabelFromMatchingPV(rawLabel: string): string {
  const withoutTags = stripIcd11Html(rawLabel)
  const bracketMatch = /\[([^\]]+)]/.exec(withoutTags)
  return (bracketMatch ? bracketMatch[1] : withoutTags).trim()
}

/**
 * Maps a single WHO `destinationEntities[]` entry to a `{code, label}` pair.
 * Prefers `title` (stripped of highlighting markup), falling back to the first
 * `matchingPVs` entry when `title` is missing.
 */
function toIcd11SearchResult(
  entity: Icd11DestinationEntity
): Icd11FieldValue | undefined {
  const code = entity.theCode
  if (!code) {
    return undefined
  }

  const cleanTitle = entity.title ? stripIcd11Html(entity.title) : ''
  const rawFallback = entity.matchingPVs?.[0]?.label
  const label =
    cleanTitle ||
    (rawFallback ? extractIcd11LabelFromMatchingPV(rawFallback) : undefined)

  if (!label) {
    return undefined
  }

  return { code, label }
}

/**
 * Parses a raw WHO ICD-11 `/search` API response into a flat list of
 * `{code, label}` results, one per `destinationEntities[]` entry.
 */
export function parseIcd11SearchResponse(response: unknown): Icd11FieldValue[] {
  if (
    typeof response !== 'object' ||
    response === null ||
    !('destinationEntities' in response) ||
    !Array.isArray(
      (response as { destinationEntities: unknown }).destinationEntities
    )
  ) {
    return []
  }

  const entities = (
    response as { destinationEntities: Icd11DestinationEntity[] }
  ).destinationEntities

  return entities
    .map(toIcd11SearchResult)
    .filter((result): result is Icd11FieldValue => result !== undefined)
}

/** Renders a `{code, label}` pair the same way it's shown in the dropdown. */
export function formatIcd11Value(value: Icd11FieldValue): string {
  return `${value.code} - ${value.label}`
}
