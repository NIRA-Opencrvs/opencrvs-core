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
import { logger } from '@opencrvs/commons'
import { promisify } from 'util'
import { gzip as _gzip } from 'zlib'
import { redis } from './redis'

const gzip = promisify(_gzip)

const TTL = 60 * 60 * 24 // 24 hours
const MEM_TTL_MS = 60 * 1000 // 1 minute
const KEY_PREFIX = 'locations:'

// Deduplicates concurrent upstream fetches during cold-cache window. Without this,
// N simultaneous misses on the same query each trigger a separate fetch. Once the
// cache warms, this map is bypassed entirely.
const inflight = new Map<string, Promise<Buffer>>()

// Redis GET allocates a new string per call. Under high concurrency, N requests
// against a warm Redis cache = N strings in memory simultaneously. memCache keeps
// one shared compressed Buffer per query, reducing allocations to one per TTL window.
// Stored compressed so write buffers to Traefik are smaller under high concurrency.
type MemEntry = { compressed: Buffer; expiresAt: number }
const memCache = new Map<string, MemEntry>()

/** Where a locations payload was ultimately served from. */
export type LocationsCacheSource = 'memory' | 'redis' | 'upstream'

export type CachedLocations = {
  compressed: Buffer
  source: LocationsCacheSource
}

export const getCachedLocations = async (
  query: string
): Promise<CachedLocations | null> => {
  const mem = memCache.get(query)
  if (mem && Date.now() < mem.expiresAt) {
    logger.debug(
      `Locations cache HIT (memory) query=${query} bytes=${mem.compressed.length} ttlLeftMs=${mem.expiresAt - Date.now()}`
    )
    return { compressed: mem.compressed, source: 'memory' }
  }

  if (mem) {
    logger.debug(`Locations memory cache EXPIRED query=${query}`)
    memCache.delete(query)
  }

  const start = Date.now()
  try {
    const stored = await redis.get(`${KEY_PREFIX}${query}`)
    if (stored) {
      const compressed = Buffer.from(stored, 'base64')
      memCache.set(query, { compressed, expiresAt: Date.now() + MEM_TTL_MS })
      logger.debug(
        `Locations cache HIT (redis) query=${query} bytes=${compressed.length} redisMs=${Date.now() - start} (promoted to memory cache)`
      )
      return { compressed, source: 'redis' }
    }
    logger.debug(
      `Locations cache MISS (memory+redis) query=${query} redisMs=${Date.now() - start}`
    )
  } catch (e) {
    logger.warn(`Locations Redis GET failed, falling through to upstream: ${e}`)
  }

  return null
}

const setCachedLocations = (query: string, compressed: Buffer) =>
  redis
    .set(`${KEY_PREFIX}${query}`, compressed.toString('base64'), { EX: TTL })
    .then(() =>
      logger.debug(
        `Locations cache STORED in redis query=${query} bytes=${compressed.length} ttlSeconds=${TTL}`
      )
    )
    .catch((e) => logger.warn(`Locations Redis SET failed: ${e}`))

export const bustLocationsCache = async () => {
  const memKeys = memCache.size
  memCache.clear()
  logger.info(`Locations memory cache cleared: ${memKeys} entries`)
  try {
    const keys = await redis.keys(`${KEY_PREFIX}*`)
    if (keys.length) {
      await redis.del(keys)
      logger.info(`Locations cache busted: ${keys.length} keys cleared`)
    } else {
      logger.info('Locations cache bust: no redis keys to clear')
    }
  } catch (e) {
    logger.warn(`Locations Redis bust failed: ${e}`)
  }
}

export const fetchAndCache = (
  query: string,
  fetcher: () => Promise<string>
): Promise<Buffer> => {
  const existing = inflight.get(query)
  if (existing) {
    logger.debug(
      `Locations upstream fetch COALESCED onto in-flight request query=${query} inflight=${inflight.size}`
    )
    return existing
  }

  logger.info(
    `Locations fetching from upstream (config service) query=${query}`
  )
  const start = Date.now()

  const promise = fetcher()
    .then(async (body) => {
      const fetchedMs = Date.now() - start
      const compressed = await gzip(body)
      memCache.set(query, { compressed, expiresAt: Date.now() + MEM_TTL_MS })
      logger.info(
        `Locations fetched from upstream query=${query} rawBytes=${Buffer.byteLength(body)} gzipBytes=${compressed.length} upstreamMs=${fetchedMs} totalMs=${Date.now() - start}`
      )
      setCachedLocations(query, compressed)
      return compressed
    })
    .catch((e) => {
      logger.error(
        `Locations upstream fetch failed query=${query} afterMs=${Date.now() - start}: ${e}`
      )
      throw e
    })
    .finally(() => inflight.delete(query))

  inflight.set(query, promise)
  return promise
}
