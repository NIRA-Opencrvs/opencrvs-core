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
import React, { useMemo } from 'react'
import {
  formatIcd11Value,
  Icd11Field,
  Icd11FieldValue,
  parseIcd11SearchResponse
} from '@opencrvs/commons/client'
import { getToken } from '@client/utils/authUtils'
import { debouncePromise, Option } from '@client/v2-events/utils'
import { EMPTY_TOKEN } from '@client/v2-events/messages/utils'
import {
  SearchableSelect,
  SearchableSelectProps
} from '../../../components/forms/inputs/SearchableSelect'

/**
 * How long to wait after the user stops typing before firing a search
 * request against the ICD-11 proxy endpoint.
 */
const SEARCH_DEBOUNCE_MS = 400

function toOption(value: Icd11FieldValue): Option<Icd11FieldValue> {
  return { value, label: formatIcd11Value(value) }
}

/**
 * Calls the configured (countryconfig-hosted) ICD-11 search proxy. The
 * proxy -- not the browser -- is responsible for attaching the WHO API
 * token, so only the search term and chapter filter need to be sent here.
 * The user's own OpenCRVS bearer token is forwarded so the proxy route can
 * verify the request comes from an authenticated user, the same way other
 * countryconfig-hosted endpoints (e.g. MOSIP NID verification) work.
 */
async function searchIcd11(
  configuration: Icd11Field['configuration'],
  searchTerm: string
): Promise<Icd11FieldValue[]> {
  if (!searchTerm.trim()) {
    return []
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), configuration.timeout)

  try {
    // Only standard headers here (Content-Type, Authorization) -- anything
    // else (e.g. a custom `api-version` header) would need to be added to
    // the countryconfig server's CORS `Access-Control-Allow-Headers` list,
    // since this crosses an origin boundary (client dev server -> country
    // config server). The WHO `api-version` is instead sent in the body and
    // applied server-side in the proxy handler.
    const res = await fetch(configuration.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        q: searchTerm,
        chapterFilter: configuration.chapterFilter,
        apiVersion: configuration.apiVersion
      }),
      signal: controller.signal
    })

    if (!res.ok) {
      throw new Error(`ICD-11 search request failed with status ${res.status}`)
    }

    return parseIcd11SearchResponse(await res.json())
  } finally {
    clearTimeout(timeoutId)
  }
}

interface Icd11InputProps
  extends Omit<
    SearchableSelectProps<Icd11FieldValue>,
    'data-testid' | 'value' | 'onChange' | 'options' | 'loadOptions'
  > {
  configuration: Icd11Field['configuration']
  value?: Icd11FieldValue | null
  onChange: (val: Icd11FieldValue | null) => void
}

function Icd11Input({
  configuration,
  value,
  onChange,
  ...inputProps
}: Icd11InputProps) {
  const loadOptions = useMemo(
    () =>
      debouncePromise(async (searchTerm: string) => {
        const results = await searchIcd11(configuration, searchTerm)
        return results.map(toOption)
      }, SEARCH_DEBOUNCE_MS),
    [configuration]
  )

  return (
    <SearchableSelect
      {...inputProps}
      data-testid={'icd11__' + inputProps.id}
      loadOptions={loadOptions}
      placeholder={inputProps.placeholder ?? 'Search ICD-11 diagnosis'}
      value={value ? toOption(value) : null}
      variant="search"
      onChange={(opt) => onChange(opt?.value ?? null)}
    />
  )
}

function Icd11Output({ value }: { value?: Icd11FieldValue }) {
  return value ? formatIcd11Value(value) : ''
}

function stringify(value?: Icd11FieldValue) {
  return value ? formatIcd11Value(value) : EMPTY_TOKEN
}

function isIcd11Empty(value?: Icd11FieldValue) {
  return !value?.code
}

export const Icd11 = {
  Input: Icd11Input,
  Output: Icd11Output,
  stringify,
  toCertificateVariables: (value: Icd11FieldValue) => value,
  isEmptyValue: isIcd11Empty
}
