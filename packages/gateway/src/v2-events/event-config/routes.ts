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
import http from 'http'
import { env } from '@gateway/environment'
import { ServerRoute } from '@hapi/hapi'
import { logger } from '@opencrvs/commons'

/**
 * The tRPC proxy carries most of the client traffic. Reusing connections to the events
 * service avoids a TCP handshake through the Swarm VIP per request, and an explicit
 * timeout bounds how long a stuck upstream can hold a request (hapi/h2o2 defaults to
 * 3 minutes). Both are tunable through environment variables.
 */
const EVENTS_PROXY_TIMEOUT_MS =
  Number(process.env.EVENTS_PROXY_TIMEOUT_MS) || 90_000

const eventsAgent =
  new URL(env.EVENTS_URL).protocol === 'http:' &&
  process.env.EVENTS_PROXY_KEEPALIVE !== 'false'
    ? new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 100,
        maxFreeSockets: 20
      })
    : undefined

export const trpcProxy = [
  {
    method: '*',
    path: '/events/{path*}',
    handler: (req, h) => {
      logger.info(`Proxying request to ${req.params.path}`)

      return h.proxy({
        uri:
          new URL(req.params.path, env.EVENTS_URL).toString() + req.url.search,
        passThrough: true,
        timeout: EVENTS_PROXY_TIMEOUT_MS,
        agent: eventsAgent
      })
    },
    options: {
      payload: {
        output: 'data',
        parse: false
      }
    }
  }
] satisfies Array<ServerRoute>
