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
import { IntlShape, useIntl } from 'react-intl'

import {
  Text as TextComponent,
  BulletList as BulletListComponent
} from '@opencrvs/components'
import {
  Paragraph as ParagraphFieldConfig,
  FieldValue
} from '@opencrvs/commons/client'

/** Separator used when `displayAsList` splits a scalar value into tokens. */
const LIST_SEPARATOR = ','

/**
 * Resolves a paragraph's stored value into one or more localized strings.
 *
 * The value is interpolated into the ICU message via the fixed key `value`
 * (like VERIFICATION_STATUS). A dotted argument name such as a field id is
 * MALFORMED in ICU and makes formatMessage throw and fall back to the raw
 * message string, so a non-dotted key must be used. `value` is always passed —
 * even when undefined — so a `select` resolves its `other` arm rather than
 * throwing "variable not provided".
 *
 * With `configuration.displayAsList`, a comma-separated scalar value is split
 * into tokens and each is localized independently through the same label —
 * turning a set of stable codes (stored as one string to satisfy the scalar
 * field model) into a localized bullet list, with no localization on the
 * backend. An empty value renders the message's fallback (`other`) arm once,
 * so e.g. an eSignet failure with no reason still shows something sensible.
 */
function resolveMessages(
  intl: IntlShape,
  field: ParagraphFieldConfig,
  value?: FieldValue
): string[] {
  const raw = value == null ? undefined : String(value)
  const format = (token: string | undefined) =>
    intl.formatMessage(field.label, { value: token })

  if (field.configuration?.displayAsList) {
    const tokens = (raw ?? '')
      .split(LIST_SEPARATOR)
      .map((token) => token.trim())
      .filter(Boolean)
    return tokens.length > 0 ? tokens.map(format) : [format(undefined)]
  }

  return [format(raw)]
}

function ParagraphContent({
  field,
  value
}: {
  field: ParagraphFieldConfig
  value?: FieldValue
}) {
  const intl = useIntl()
  const configuration = field.configuration
  const fontVariant = configuration.styles?.fontVariant
  const hint = configuration.styles?.hint
  const error = configuration.styles?.error
  const messages = resolveMessages(intl, field, value)

  // `error` (red) takes precedence over `hint` (grey). When neither is set we
  // pass undefined so each renderer keeps its own default colour.
  const color = error ? 'negative' : hint ? 'grey500' : undefined

  if (configuration.displayAsList) {
    return (
      <BulletListComponent
        color={color}
        font={fontVariant ?? 'reg16'}
        id={field.id}
        items={messages}
      />
    )
  }

  return (
    <TextComponent
      color={color}
      element="p"
      variant={fontVariant ?? 'reg16'}
    >
      <span dangerouslySetInnerHTML={{ __html: messages[0] }} />
    </TextComponent>
  )
}

function ParagraphInput({
  field,
  value
}: {
  field: ParagraphFieldConfig
  value?: FieldValue
}) {
  return <ParagraphContent field={field} value={value} />
}

/**
 * Review-page renderer. Self-gates on `displayOnReview` so any Output caller
 * (review, correction summary, duplicate view, ...) preserves the historical
 * behaviour where paragraphs render nothing unless explicitly enabled.
 */
function ParagraphOutput({
  field,
  value
}: {
  field: ParagraphFieldConfig
  value?: FieldValue
}) {
  if (!field.configuration?.displayOnReview) {
    return null
  }
  return <ParagraphContent field={field} value={value} />
}

export const Paragraph = {
  Input: ParagraphInput,
  Output: ParagraphOutput
}
