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
import {
  FIELD_GROUP_TITLE,
  ISerializedFormSection,
  LOCATION_SEARCH_INPUT,
  SELECT_WITH_OPTIONS,
  SIMPLE_DOCUMENT_UPLOADER,
  TEXT,
  UserSection
} from '@client/forms/index'
import { messages as userFormMessages } from '@client/i18n/messages/views/userForm'

const NATIONALITY = {
  Afghan: 'Afghan',
  Albanian: 'Albanian',
  Algerian: 'Algerian',
  American: 'American',
  Andorran: 'Andorran',
  Angolan: 'Angolan',
  Antiguans: 'Antiguans',
  Argentinean: 'Argentinean',
  Armenian: 'Armenian',
  Australian: 'Australian',
  Austrian: 'Austrian',
  Azerbaijani: 'Azerbaijani',
  Bahamian: 'Bahamian',
  Bahraini: 'Bahraini',
  Bangladeshi: 'Bangladeshi',
  Barbadian: 'Barbadian',
  Barbudans: 'Barbudans',
  Batswana: 'Batswana',
  Belarusian: 'Belarusian',
  Belgian: 'Belgian',
  Belizean: 'Belizean',
  Beninese: 'Beninese',
  Bhutanese: 'Bhutanese',
  Bolivian: 'Bolivian',
  Bosnian: 'Bosnian',
  Brazilian: 'Brazilian',
  British: 'British',
  Bruneian: 'Bruneian',
  Bulgarian: 'Bulgarian',
  Burkinabe: 'Burkinabe',
  Burmese: 'Burmese',
  Burundian: 'Burundian',
  Cambodian: 'Cambodian',
  Cameroonian: 'Cameroonian',
  Canadian: 'Canadian',
  Cape_Verdean: 'Cape Verdean',
  Central_African: 'Central African',
  Chadian: 'Chadian',
  Chilean: 'Chilean',
  Chinese: 'Chinese',
  Colombian: 'Colombian',
  Comoran: 'Comoran',
  Congolese: 'Congolese',
  Costa_Rican: 'Costa Rican',
  Croatian: 'Croatian',
  Cuban: 'Cuban',
  Cypriot: 'Cypriot',
  Czech: 'Czech',
  Danish: 'Danish',
  Djibouti: 'Djibouti',
  Dominican: 'Dominican',
  Dutch: 'Dutch',
  East_Timorese: 'East Timorese',
  Ecuadorean: 'Ecuadorean',
  Egyptian: 'Egyptian',
  Emirian: 'Emirian',
  Equatorial_Guinean: 'Equatorial Guinean',
  Eritrean: 'Eritrean',
  Estonian: 'Estonian',
  Ethiopian: 'Ethiopian',
  Fijian: 'Fijian',
  Filipino: 'Filipino',
  Finnish: 'Finnish',
  French: 'French',
  Gabonese: 'Gabonese',
  Gambian: 'Gambian',
  Georgian: 'Georgian',
  German: 'German',
  Ghanaian: 'Ghanaian',
  Greek: 'Greek',
  Grenadian: 'Grenadian',
  Guatemalan: 'Guatemalan',
  Guinea_Bissauan: 'Guinea-Bissauan',
  Guinean: 'Guinean',
  Guyanese: 'Guyanese',
  Haitian: 'Haitian',
  Herzegovinian: 'Herzegovinian',
  Honduran: 'Honduran',
  Hungarian: 'Hungarian',
  I_Kiribati: 'I-Kiribati',
  Icelander: 'Icelander',
  Indian: 'Indian',
  Indonesian: 'Indonesian',
  Iranian: 'Iranian',
  Iraqi: 'Iraqi',
  Irish: 'Irish',
  Israeli: 'Israeli',
  Italian: 'Italian',
  Ivorian: 'Ivorian',
  Jamaican: 'Jamaican',
  Japanese: 'Japanese',
  Jordanian: 'Jordanian',
  Kazakhstani: 'Kazakhstani',
  Kenyan: 'Kenyan',
  Kittian_and_Nevisian: 'Kittian and Nevisian',
  Kuwaiti: 'Kuwaiti',
  Kyrgyz: 'Kyrgyz',
  Laotian: 'Laotian',
  Latvian: 'Latvian',
  Lebanese: 'Lebanese',
  Liberian: 'Liberian',
  Libyan: 'Libyan',
  Liechtensteiner: 'Liechtensteiner',
  Lithuanian: 'Lithuanian',
  Luxembourger: 'Luxembourger',
  Macedonian: 'Macedonian',
  Malagasy: 'Malagasy',
  Malawian: 'Malawian',
  Malaysian: 'Malaysian',
  Maldivian: 'Maldivian',
  Malian: 'Malian',
  Maltese: 'Maltese',
  Marshallese: 'Marshallese',
  Mauritanian: 'Mauritanian',
  Mauritian: 'Mauritian',
  Mexican: 'Mexican',
  Micronesian: 'Micronesian',
  Moldovan: 'Moldovan',
  Monacan: 'Monacan',
  Mongolian: 'Mongolian',
  Moroccan: 'Moroccan',
  Mosotho: 'Mosotho',
  Motswana: 'Motswana',
  Mozambican: 'Mozambican',
  Namibian: 'Namibian',
  Nauruan: 'Nauruan',
  Nepalese: 'Nepalese',
  New_Zealander: 'New Zealander',
  Ni_Vanuatu: 'Ni-Vanuatu',
  Nicaraguan: 'Nicaraguan',
  Nigerian: 'Nigerian',
  Nigerien: 'Nigerien',
  North_Korean: 'North Korean',
  Northern_Irish: 'Northern Irish',
  Norwegian: 'Norwegian',
  Omani: 'Omani',
  Pakistani: 'Pakistani',
  Palauan: 'Palauan',
  Panamanian: 'Panamanian',
  Papua_New_Guinean: 'Papua New Guinean',
  Paraguayan: 'Paraguayan',
  Peruvian: 'Peruvian',
  Polish: 'Polish',
  Portuguese: 'Portuguese',
  Qatari: 'Qatari',
  Romanian: 'Romanian',
  Russian: 'Russian',
  Rwandan: 'Rwandan',
  Saint_Lucian: 'Saint Lucian',
  Salvadoran: 'Salvadoran',
  Samoan: 'Samoan',
  San_Marinese: 'San Marinese',
  Sao_Tomean: 'Sao Tomean',
  Saudi: 'Saudi',
  Scottish: 'Scottish',
  Senegalese: 'Senegalese',
  Serbian: 'Serbian',
  Seychellois: 'Seychellois',
  Sierra_Leonean: 'Sierra Leonean',
  Singaporean: 'Singaporean',
  Slovakian: 'Slovakian',
  Slovenian: 'Slovenian',
  Solomon_Islander: 'Solomon Islander',
  Somali: 'Somali',
  South_African: 'South African',
  South_Korean: 'South Korean',
  Spanish: 'Spanish',
  Sri_Lankan: 'Sri Lankan',
  Sudanese: 'Sudanese',
  Surinamer: 'Surinamer',
  Swazi: 'Swazi',
  Swedish: 'Swedish',
  Swiss: 'Swiss',
  Syrian: 'Syrian',
  Taiwanese: 'Taiwanese',
  Tajik: 'Tajik',
  Tanzanian: 'Tanzanian',
  Thai: 'Thai',
  Togolese: 'Togolese',
  Tongan: 'Tongan',
  Trinidadian_or_Tobagonian: 'Trinidadian or Tobagonian',
  Tunisian: 'Tunisian',
  Turkish: 'Turkish',
  Tuvaluan: 'Tuvaluan',
  Ugandan: 'Ugandan',
  Ukrainian: 'Ukrainian',
  Uruguayan: 'Uruguayan',
  Uzbekistani: 'Uzbekistani',
  Venezuelan: 'Venezuelan',
  Vietnamese: 'Vietnamese',
  Welsh: 'Welsh',
  Yemenite: 'Yemenite',
  Zambian: 'Zambian',
  Zimbabwean: 'Zimbabwean'
} as const

const nationalityOptions = Object.keys(NATIONALITY).map((nat) => ({
  value: nat,
  label: {
    defaultMessage: nat,
    description: `label for ${nat}`,
    id: `nationality.${nat}`
  }
}))

function userSectionFormType(): ISerializedFormSection {
  return {
    id: UserSection.User,
    viewType: 'form',
    name: userFormMessages.user,
    title: userFormMessages.userFormTitle,
    groups: [
      {
        id: 'registration-office',
        preventContinueIfError: true,
        title: userFormMessages.assignedRegistrationOffice,
        conditionals: [
          {
            action: 'hide',
            expression:
              'values.skippedOfficeSelction && values.registrationOffice'
          }
        ],
        fields: [
          {
            name: 'assignedRegistrationOffice',
            type: FIELD_GROUP_TITLE,
            label: userFormMessages.assignedRegistrationOfficeGroupTitle,
            required: false,
            hidden: true,
            initialValue: '',
            validator: []
          },
          {
            name: 'registrationOffice',
            type: LOCATION_SEARCH_INPUT,
            label: userFormMessages.registrationOffice,
            required: true,
            initialValue: '',
            searchableResource: ['offices'],
            searchableType: ['CRVS_OFFICE'],
            validator: [
              {
                operation: 'officeMustBeSelected'
              }
            ],
            locationList: [],
            mapping: {
              mutation: {
                operation: 'fieldNameTransformer',
                parameters: ['primaryOffice']
              },
              query: {
                operation: 'locationIDToFieldTransformer',
                parameters: ['primaryOffice']
              }
            }
          }
        ]
      },
      {
        id: 'user-view-group',
        title: userFormMessages.userDetails,
        fields: [
          {
            name: 'familyName',
            type: TEXT,
            label: userFormMessages.lastName,
            required: true,
            initialValue: '',
            validator: [{ operation: 'englishOnlyNameFormat' }],
            mapping: {
              mutation: {
                operation: 'fieldToNameTransformer',
                parameters: ['en', 'familyName']
              },
              query: {
                operation: 'nameToFieldTransformer',
                parameters: ['en', 'familyName']
              }
            }
          },
          {
            name: 'firstName',
            type: TEXT,
            label: userFormMessages.firstName,
            required: true,
            initialValue: '',
            validator: [{ operation: 'englishOnlyNameFormat' }],
            mapping: {
              mutation: {
                operation: 'fieldToNameTransformer',
                parameters: ['en', 'firstNames']
              },
              query: {
                operation: 'nameToFieldTransformer',
                parameters: ['en', 'firstNames']
              }
            }
          },
          {
            name: 'username',
            type: TEXT,
            label: userFormMessages.username,
            previewGroup: 'userNameGroup',
            required: false,
            initialValue: '',
            validator: [],
            readonly: true,
            hidden: true
          },
          {
            name: 'nationality',
            type: SELECT_WITH_OPTIONS,
            label: userFormMessages.nationality,
            required: true,
            initialValue: 'Ugandan',
            validator: [],
            placeholder: userFormMessages.formSelectPlaceholder,
            options: nationalityOptions,
            mapping: {
              mutation: { operation: 'fieldToDataTransformer' },
              query: { operation: 'dataToFieldTransformer' }
            }
          },
          {
            name: 'idType',
            type: SELECT_WITH_OPTIONS,
            label: userFormMessages.idType,
            required: true,
            initialValue: { experession: '', dependsOn: ['nationality'] },
            validator: [],
            placeholder: userFormMessages.formSelectPlaceholder,
            optionCondition:
              "({ field, values }) => values.nationality === 'Ugandan' ? field.value === 'NATIONAL_ID' : ['PASSPORT', 'ALIEN_ID', 'REFUGEE_ID'].includes(field.value)",
            options: [
              {
                value: 'NATIONAL_ID',
                label: {
                  id: 'form.field.label.iDTypeNationalID',
                  defaultMessage: 'National ID',
                  description: 'Option for form field: Type of ID'
                }
              },
              {
                value: 'PASSPORT',
                label: {
                  id: 'form.field.label.iDTypePassport',
                  defaultMessage: 'Passport',
                  description: 'Option for form field: Type of ID'
                }
              },
              {
                value: 'ALIEN_ID',
                label: {
                  id: 'form.field.label.iDTypeAlienID',
                  defaultMessage: 'Alien ID',
                  description: 'Option for form field: Type of ID'
                }
              },
              {
                value: 'REFUGEE_ID',
                label: {
                  id: 'form.field.label.iDTypeRefugeeID',
                  defaultMessage: 'Refugee ID',
                  description: 'Option for form field: Type of ID'
                }
              }
            ],
            mapping: {
              mutation: { operation: 'fieldToDataTransformer' },
              query: { operation: 'dataToFieldTransformer' }
            }
          },
          {
            name: 'nid',
            type: TEXT,
            label: userFormMessages.nid,
            required: true,
            initialValue: { experession: '', dependsOn: ['idType'] },
            validator: [
              { operation: 'validIDNumber', parameters: ['NATIONAL_ID'] }
            ],
            conditionals: [
              {
                action: 'hide',
                expression: 'values.idType !== "NATIONAL_ID"'
              }
            ],
            mapping: {
              mutation: { operation: 'fieldToDataTransformer' },
              query: { operation: 'dataToFieldTransformer' }
            }
          },
          {
            name: 'passport',
            type: TEXT,
            label: userFormMessages.passport,
            required: true,
            initialValue: { experession: '', dependsOn: ['idType'] },
            validator: [],
            conditionals: [
              {
                action: 'hide',
                expression: 'values.idType !== "PASSPORT"'
              }
            ],
            mapping: {
              mutation: { operation: 'fieldToDataTransformer' },
              query: { operation: 'dataToFieldTransformer' }
            }
          },
          {
            name: 'alienId',
            type: TEXT,
            label: userFormMessages.alienId,
            required: true,
            initialValue: { experession: '', dependsOn: ['idType'] },
            validator: [{ operation: 'validAlienIdNumber' }],
            conditionals: [
              {
                action: 'hide',
                expression: 'values.idType !== "ALIEN_ID"'
              }
            ],
            mapping: {
              mutation: { operation: 'fieldToDataTransformer' },
              query: { operation: 'dataToFieldTransformer' }
            }
          },
          {
            name: 'refugeeId',
            type: TEXT,
            label: userFormMessages.refugeeId,
            required: true,
            initialValue: { experession: '', dependsOn: ['idType'] },
            validator: [],
            conditionals: [
              {
                action: 'hide',
                expression: 'values.idType !== "REFUGEE_ID"'
              }
            ],
            mapping: {
              mutation: { operation: 'fieldToDataTransformer' },
              query: { operation: 'dataToFieldTransformer' }
            }
          },
          {
            name: 'mobile',
            type: TEXT,
            label: userFormMessages.phoneNumber,
            required: window.config.USER_NOTIFICATION_DELIVERY_METHOD === 'sms',
            initialValue: '',
            validator: [{ operation: 'phoneNumberFormat' }]
          },
          {
            name: 'email',
            type: TEXT,
            label: userFormMessages.email,
            required:
              window.config.USER_NOTIFICATION_DELIVERY_METHOD === 'email',
            initialValue: '',
            validator: [{ operation: 'emailAddressFormat' }]
          },
          {
            name: 'fullHonorificName',
            type: TEXT,
            label: userFormMessages.fullHonorificName,
            required: false,
            initialValue: '',
            validator: []
          },
          {
            name: 'seperator',
            type: 'DIVIDER',
            label: {
              defaultMessage: ' ',
              description: 'empty string',
              id: 'form.field.label.empty'
            },
            initialValue: '',
            ignoreBottomMargin: true,
            validator: [],
            conditionals: []
          },
          {
            name: 'role',
            type: SELECT_WITH_OPTIONS,
            label: userFormMessages.role,
            required: true,
            initialValue: '',
            validator: [],
            options: [],
            conditionals: []
          },
          {
            name: 'facilityId',
            type: LOCATION_SEARCH_INPUT,
            label: userFormMessages.facility,
            conditionals: [
              {
                action: 'hide',
                expression: 'values.role !== "HEALTH_FACILITY_ADMINISTRATOR"'
              }
            ],
            required: true,
            initialValue: '',
            searchableResource: ['activeFacilities', 'locations'],
            searchableType: ['HEALTH_FACILITY'],
            validator: [{ operation: 'facilityMustBeSelected' }],
            locationList: [],
            mapping: {
              mutation: { operation: 'fieldToDataTransformer' },
              query: { operation: 'dataToFieldTransformer' }
            }
          },
          {
            name: 'device',
            type: TEXT,
            label: userFormMessages.userDevice,
            required: false,
            initialValue: '',
            validator: []
          }
        ]
      },
      {
        id: 'signature-attachment',
        title: userFormMessages.userSignatureAttachmentTitle,
        preventContinueIfError: true,
        conditionals: [
          {
            action: 'hide',
            expression:
              "!values.scopes?.includes('profile.electronic-signature')"
          }
        ],
        fields: [
          {
            name: 'attachmentTitle',
            type: FIELD_GROUP_TITLE,
            hidden: true,
            label: userFormMessages.userAttachmentSection,
            required: false,
            initialValue: '',
            validator: []
          },
          {
            name: 'signature',
            type: SIMPLE_DOCUMENT_UPLOADER,
            label: userFormMessages.userAttachmentSection,
            description: userFormMessages.userSignatureAttachmentDesc,
            allowedDocType: ['image/png'],
            initialValue: '',
            required: true,
            validator: []
          }
        ]
      }
    ]
  }
}

const getPreviewGroups = () => {
  return userSectionFormType().groups.map((group) => {
    return {
      id: `preview-${group.id}`,
      fields: group.fields
    }
  })
}

const userSectionPreviewType: ISerializedFormSection = {
  id: UserSection.Preview,
  viewType: 'preview',
  name: userFormMessages.userFormReviewTitle,
  title: userFormMessages.userFormTitle,
  groups: getPreviewGroups()
}

export function getCreateUserForm() {
  return {
    sections: [userSectionFormType(), userSectionPreviewType]
  }
}
