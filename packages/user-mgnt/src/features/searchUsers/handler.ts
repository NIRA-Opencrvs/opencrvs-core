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
import * as Hapi from '@hapi/hapi'
import * as Joi from 'joi'

import User, { IUserModel } from '@user-mgnt/model/user'
import { FilterQuery, SortOrder } from 'mongoose'
import { resolveLocationChildren } from '@user-mgnt/utils/location'
import { UUID } from '@opencrvs/commons'

interface IVerifyPayload {
  name?: string
  username?: string
  mobile?: string
  status?: string
  role?: string
  primaryOfficeId?: string
  locationId?: UUID
  count: number
  skip: number
  sortOrder: SortOrder
}

export default async function searchUsers(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const {
    name,
    username,
    mobile,
    status,
    role,
    primaryOfficeId,
    locationId,
    count,
    skip,
    sortOrder
  } = request.payload as IVerifyPayload
  let criteria: FilterQuery<IUserModel> = {}
  if (username) {
    criteria = { ...criteria, username }
  }
  if (mobile) {
    criteria = { ...criteria, mobile }
  }
  if (name) {
    const nameParts = name.trim().split(/\s+/).filter(Boolean)
    if (nameParts.length > 0) {
      criteria = {
        ...criteria,
        $and: nameParts.map((namePart) => {
          const escapedNamePart = namePart.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
          )
          const nameRegex = { $regex: escapedNamePart, $options: 'i' }

          return {
            $or: [{ 'name.given': nameRegex }, { 'name.family': nameRegex }]
          }
        })
      }
    }
  }
  if (primaryOfficeId) {
    criteria = { ...criteria, primaryOfficeId }
  }
  if (locationId) {
    const locationChildren = await resolveLocationChildren(locationId)
    criteria = { ...criteria, primaryOfficeId: { $in: locationChildren } }
  }
  if (status) {
    criteria = { ...criteria, status }
  }
  if (role) {
    criteria = { ...criteria, role }
  }
  const userList: IUserModel[] = await User.find(criteria)
    .populate('role')
    .skip(skip)
    .limit(count)
    .sort({
      creationDate: sortOrder
    })
  return {
    totalItems: await User.find(criteria).count(),
    results: userList
  }
}

export const searchSchema = Joi.object({
  name: Joi.string().optional(),
  username: Joi.string().optional(),
  mobile: Joi.string().optional(),
  status: Joi.string().optional(),
  primaryOfficeId: Joi.string().optional(),
  locationId: Joi.string().optional(),
  count: Joi.number().min(0).required(),
  skip: Joi.number().min(0).required(),
  sortOrder: Joi.string().valid('asc', 'desc').required(),
  role: Joi.string().optional()
})
