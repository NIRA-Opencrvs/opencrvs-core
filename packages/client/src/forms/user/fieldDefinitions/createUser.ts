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

const POLICESTATIONS = {
  JINJA_ROAD_MAIN_STATION: 'JINJA ROAD MAIN STATION',
  INTERNAL_AFFAIRS: 'INTERNAL AFFAIRS POLICE STATION',
  KITINTALE: 'KITINTALE POLICE STATION',
  ACHOLI_QUARTERS: 'ACHOLI QUARTERS POLICE STATION',
  KINAWATAKA: 'KINAWATAKA POLICE  STATION',
  KOLOLO: 'KOLOLO POLICE STATION',
  MUBS: 'MUBS POLICE STATION',
  KYAMBOGO: 'KYAMBOGO POLICE STATION',
  MAWANDA: 'MAWANDA POLICE STATION',
  KIKAYA: 'KIKAYA POLICE STATION',
  KISASI: 'KISASI POLICE STATION',
  NTINDA: 'NTINDA POLICE STATION',
  KIRA_ROAD: 'KIRA ROAD POLICE STATION',
  KAMWOKYA: 'KAMWOKYA POLICE STATION',
  KYEBANDO: 'KYEBANDO POLICE STATION',
  KIWATULE: 'KIWATULE',
  BUKOTO: 'BUKOTO',
  BWEYOGERERE: 'BWEYOGERERE POLICE STATION',
  KIREKA: 'KIREKA POLICE STATION',
  KIRINYA: 'KIRINYA  POLICE STATION',
  KIWOLOGOMA: 'KIWOLOGOMA POLICE STATION',
  NAJERA: 'NAJERA POLICE STATION',
  NALYA: 'NALYA POLICE STATION',
  NAMUGONGO: 'NAMUGONGO POLICE STATION',
  KIRA_CENTRAL: 'KIRA CENTRAL POLICE STATION',
  MUKONO: 'MUKONO POLICE STATION',
  SEETA: 'SEETA POLICE STATION',
  MBALALA: 'MBALALA POLICE STATION',
  UCU: 'UCU POLICE STATION',
  NAMAGUNGA: 'NAMAGUNGA POLICE STATION',
  KATOSI: 'KATOSI POLICE STATION',
  KYAMPISI: 'KYAMPISI POLICE STATION',
  NAKIFUMA: 'NAKIFUMA POLICE STATION',
  NTUNDA: 'NTUNDA POLICE STATION',
  NAGALAMA_MAIN_STATION: 'NAGALAMA MAIN STATION',
  KAWEMPE: 'KAWEMPE POLICE STATION',
  BWAISE: 'BWAISE POLICE STATION',
  MAGANJO: 'MAGANJO POLICE STATION',
  KAWANDA: 'KAWANDA POLICE STATION',
  LUGOBA: 'LUGOBA POLICE STATION',
  NANSANA: 'NANSANA POLICE STATION',
  KAKIRI: 'KAKIRI POLICE STATION',
  OLD_KAMPALA: 'OLD KAMPALA POLICE STATION',
  LUGALA: 'LUGALA POLICE STATION',
  KASANGATI: 'KASANGATI POLICE STATION',
  WAKISO: 'WAKISO POLICE STATION',
  WANDEGEYA: 'WANDEGEYA POLICE STATION',
  MAKERERE: 'MAKERERE POLICE STATION',
  KIKONI: 'KIKONI POLICE STATION',
  MULAGO_POLICE_STATIONTATION: 'MULAGO POLICE STATIONTATION',
  KATWE: 'KATWE POLICE STATION',
  NDEEBA: 'NDEEBA POLICE STATION',
  NATETE: 'NATETE POLICE STATION',
  SALAMA: 'SALAMA POLICE STATION',
  NDEJJE: 'NDEJJE POLICE STATION',
  MAKINDYE: 'MAKINDYE POLICE STATION',
  MUTUNDWE: 'MUTUNDWE POLICE STATION',
  BUNAMWAYA: 'BUNAMWAYA POLICE STATION',
  KITEBIKABOWA: 'KITEBI-KABOWA POLICE STATION',
  CLOCK_TOWER: 'CLOCK TOWER POLICE STATION',
  KATWE_RADIO_ROOM: 'KATWE RADIO ROOM',
  NSANGI: 'NSANGI POLICE STATION',
  MAYA: 'MAYA POLICE STATION',
  NABINGO: 'NABINGO POLICE STATION',
  KYENGERA: 'KYENGERA POLICE STATION',
  NALUMUNYE: 'NALUMUNYE POLICE STATION',
  NSANGI_SUB_COUNTY: 'NSANGI SUB COUNTY',
  KIBULI: 'KIBULI POLICE STATION',
  KISUGU: 'KISUGU POLICE STATION',
  GABA: 'GABA POLICE STATION',
  KABALAGALA_MAIN_STATION: 'KABALAGALA MAIN STATION',
  KANSANGA_STATION: 'KANSANGA STATION',
  ENTEBBE: 'ENTEBBE POLICE STATION',
  KISUBI: 'KISUBI POLICE STATION',
  KASENYI: 'KASENYI POLICE STATION',
  KASANJE: 'KASANJE POLICE STATION',
  KITOORO: 'KITOORO POLICE STATION',
  ABAITABARI: 'ABAITABARI POLICE STATION',
  NAKIWOGO: 'NAKIWOGO POLICE STATION',
  MPALA: 'MPALA POLICE STATION',
  KATABI: 'KATABI POLICE STATION',
  NAKAWUKA: 'NAKAWUKA POLICE STATION',
  KAJANSI: 'KAJANSI POLICE STATION',
  LUBOWA: 'LUBOWA POLICE STATION',
  BWEBAJA: 'BWEBAJA POLICE STATION',
  AKRITE: 'AKRITE POLICE STATION',
  NAMASUBA: 'NAMASUBA',
  MUTUNGO: 'MUTUNGO POLICE STATION',
  NKURUMAH: 'NKURUMAH POLICE STATION',
  NAKASERO: 'NAKASERO POLICE STATION',
  KISEKA: 'KISEKA POLICE STATION',
  CENTRAL_KAMPALA: 'CENTRAL POLICE STATION KAMPALA',
  CENTRAL_KAPCHORWA: 'CENTRAL POLICE STATION KAPCHORWA',
  SIPI: 'SIPI POLICE STATION',
  CENTRAL_KWEEN: 'CENTRAL POLICE STATION KWEEN',
  NGENGE: 'NGENGE POLICE STATION',
  KAPRORON: 'KAPRORON POLICE STATION',
  CENTRAL_BUKWO: 'CENTRAL POLICE STATION BUKWO',
  SUAM: 'SUAM POLICE STATION',
  CHESOWER: 'CHESOWER POLICE STATION',
  CENTRAL_GULU: 'CENTRAL POLICE STATION GULU',
  AWACH: 'AWACH POLICE STATION',
  REGION_ASWA: 'REGION ASWA',
  KITGUM: 'KITGUM POLICE STATION',
  CENTRAL_AGAGO: 'CENTRAL POLICE STATION- AGAGO',
  KALONGO: 'KALONGO POLICE STATION',
  CENTRAL_PADER: 'CENTRAL POLICE STATION PADER',
  ATANGA: 'ATANGA POLICE STATION',
  PAJULE: 'PAJULE POLICE STATION',
  CENTRAL_LAMWO: 'CENTRAL POLICE STATION LAMWO',
  MADIOPEI: 'MADIOPEI',
  PALABEKKAL: 'PALABEKKAL',
  AMURU_CENTRAL: 'AMURU CENTRAL POLICE STATION',
  ATIAK: 'ATIAK',
  ELEGU: 'ELEGU',
  CENTRAL_NWOYA: 'CENTRAL POLICE STATION NWOYA',
  SOROTI_CENTRAL: 'SOROTI CENTRAL POLICE STATION',
  FIRE__RESCUE__SOROTI: 'FIRE & RESCUE – SOROTI',
  GWERI: 'GWERI',
  AMURIA_CENTRAL: 'AMURIA CENTRAL POLICE STATION',
  SERERE_CENTRAL: 'SERERE CENTRAL POLICE STATION',
  BUKEDEA_CENTRAL: 'BUKEDEA CENTRAL POLICE STATION',
  KACHUMBALA: 'KACHUMBALA',
  KABERAMAIDO_CENTRAL: 'KABERAMAIDO CENTRAL POLICE STATION',
  BULULU: 'BULULU',
  NGORA_CENTRAL: 'NGORA CENTRAL POLICE STATION',
  KOBUKU: 'KOBUKU',
  KUMI_CENTRAL: 'KUMI CENTRAL POLICE STATION',
  NYERO: 'NYERO',
  KATAKWI_CENTRAL: 'KATAKWI CENTRAL POLICE STATION',
  KAPELEBYONG_CENTRAL: 'KAPELEBYONG CENTRAL POLICE STATION',
  OBALANGA: 'OBALANGA',
  HOIMA_MAIN_STATION: 'HOIMA MAIN STATION',
  KIGOROBYA: 'KIGOROBYA',
  KYANGWALI: 'KYANGWALI',
  KIZIRANFUMBI: 'KIZIRANFUMBI',
  KIKUUBE_CENTRAL: 'KIKUUBE CENTRAL POLICE STATION',
  MASINDI_MAIN_STATION: 'MASINDI MAIN STATION',
  KINYARA: 'KINYARA',
  KAGADI_MAIN_STATION: 'KAGADI MAIN STATION',
  ISUNGA: 'ISUNGA',
  MABAALE: 'MABAALE',
  KIBAALE_MAIN_STATION: 'KIBAALE MAIN STATION',
  KAKUMIRO_MAIN_STATION: 'KAKUMIRO MAIN STATION',
  IGAYAZA: 'IGAYAZA',
  KIRYANDONGO_MAIN_STATION: 'KIRYANDONGO MAIN STATION',
  BWEYALE: 'BWEYALE',
  BULIISA_MAIN_STATION: 'BULIISA MAIN STATION',
  BIISO: 'BIISO',
  CENTRAL_KAMULI: 'CENTRAL POLICE STATION KAMULI',
  NAMWENDWA: 'NAMWENDWA',
  MBULAMUTI: 'MBULAMUTI',
  CENTRAL_BUYENDE: 'CENTRAL POLICE STATION BUYENDE',
  KIDERA: 'KIDERA',
  IRUNDU: 'IRUNDU',
  JOC_KALIRO: 'JOC KALIRO',
  KALIRO_CENTRAL: 'KALIRO CENTRAL POLICE STATION',
  LUUKA_CENTRAL: 'LUUKA CENTRAL POLICE STATION',
  CENTRAL_MBALE: 'CENTRAL POLICE STATION MBALE',
  BUSIU: 'BUSIU POLICE STATION',
  NAKALOKE: 'NAKALOKE POLICE STATION',
  NKOMA: 'NKOMA POLICE STATION',
  NAUYO: 'NAUYO POLICE STATION',
  SIRONKO: 'SIRONKO POLICE STATION',
  BUSULANI: 'BUSULANI POLICE STATION',
  CENTRAL_MANAFWA: 'CENTRAL POLICE STATION MANAFWA',
  CENTRAL_BULAMBULI: 'CENTRAL POLICE STATION BULAMBULI',
  CENTRAL_BUDUDA: 'CENTRAL POLICE STATION BUDUDA',
  LWAKHAKHA: 'LWAKHAKHA POLICE STATION',
  CENTRAL_KABALE: 'CENTRAL POLICE STATION KABALE',
  KATUNA: 'KATUNA POLICE STATION',
  MAZIBA: 'MAZIBA POLICE STATION',
  CENTRAL_KISORO: 'CENTRAL POLICE STATION KISORO',
  BUNAGANA: 'BUNAGANA POLICE STATION',
  BAUSANZA_BORDER_STATION: 'BAUSANZA BORDER STATION',
  CENTRAL_RUKUNGIRI: 'CENTRAL POLICE STATION RUKUNGIRI',
  RUHINDA: 'RUHINDA POLICE STATION',
  RWENSHAMA: 'RWENSHAMA POLICE STATION',
  BUGANGARI: 'BUGANGARI POLICE STATION',
  KIHIHI: 'KIHIHI POLICE STATION',
  ISHASHA: 'ISHASHA POLICE STATION',
  KANUNGU: 'KANUNGU POLICE STATION',
  RUBANDA: 'RUBANDA POLICE STATION',
  BUFUNDI: 'BUFUNDI POLICE STATION',
  RUKIGA: 'RUKIGA POLICE STATION',
  MUHANGA: 'MUHANGA POLICE STATION',
  BUKINDA: 'BUKINDA POLICE STATION',
  JOC_SAVANNAH_LUWEERO: 'JOC SAVANNAH LUWEERO',
  CENTRAL_LUWEERO: 'CENTRAL POLICE STATION LUWEERO',
  KASANA: 'KASANA POLICE STATION',
  WOBULENZI: 'WOBULENZI POLICE STATION',
  ZIROBWE: 'ZIROBWE POLICE STATION',
  BOMBO: 'BOMBO POLICE STATION',
  CENTRAL_NAKASONGOLA: 'CENTRAL POLICE STATION NAKASONGOLA',
  KAKOOGE: 'KAKOOGE POLICE STATION',
  MIGYEERA: 'MIGYEERA POLICE STATION',
  RWAMPANGA: 'RWAMPANGA POLICE STATION',
  KAZWAMA: 'KAZWAMA POLICE STATION',
  KIWOKO_CENTRAL: 'KIWOKO CENTRAL POLICE STATION',
  NGOMA: 'NGOMA POLICE STATION',
  KAPEKA: 'KAPEKA POLICE STATION',
  SEMUTO: 'SEMUTO POLICE STATION',
  BUTALANGO: 'BUTALANGO POLICE STATION',
  NAMUNGALWE: 'NAMUNGALWE POLICE STATION',
  BULIDA: 'BULIDA POLICE STATION',
  KALUUBA: 'KALUUBA POLICE STATION',
  LOLWE: 'LOLWE POLICE STATION.',
  BWONDA: 'BWONDA POLICE STATION',
  CENTRAL_MASAKA: 'CENTRAL POLICE STATION MASAKA',
  NYENDO: 'NYENDO POLICE STATION',
  KYABAKUZA: 'KYABAKUZA POLICE STATION',
  MPUGWE: 'MPUGWE POLICE STATION',
  CENTRAL_KALANGALA: 'CENTRAL POLICE STATION KALANGALA',
  CENTRAL_LWENGO: 'CENTRAL POLICE STATION LWENGO',
  MBIRIZI: 'MBIRIZI POLICE STATION',
  KYAZANGA: 'KYAZANGA POLICE STATION',
  KINONI: 'KINONI POLICE STATION',
  CENTRAL_RAKAI: 'CENTRAL POLICE STATION RAKAI',
  CENTRAL_KYOTERA: 'CENTRAL POLICE STATION KYOTERA',
  KASENSERO: 'KASENSERO POLICE STATION',
  CENTRAL_LYANTONDE: 'CENTRAL POLICE STATION LYANTONDE',
  CENTRAL_KALUNGU: 'CENTRAL POLICE STATION KALUNGU',
  LUKAYA: 'LUKAYA POLICE STATION',
  KYAMULIBWA: 'KYAMULIBWA POLICE STATION',
  BUKULULA: 'BUKULULA POLICE STATION',
  KALIRO: 'KALIRO POLICE STATION',
  LWABEENGE: 'LWABEENGE POLICE STATION',
  CENTRAL_SEMBABULE: 'CENTRAL POLICE STATION SEMBABULE',
  MATEETE: 'MATEETE POLICE STATION',
  LWEMIYAGA: 'LWEMIYAGA POLICE STATION',
  CENTRAL_BUKOMANSIMBI: 'CENTRAL POLICE STATION BUKOMANSIMBI',
  BUTENGA: 'BUTENGA POLICE STATION',
  MISANVU: 'MISANVU POLICE STATION',
  KIKUUTA: 'KIKUUTA POLICE STATION',
  BIGASA: 'BIGASA POLICE STATION',
  CENTRAL_MITYANA: 'CENTRAL POLICE STATION MITYANA',
  MITYANA_BAR_KUNYWA: 'MITYANA BAR (KUNYWA)',
  CENTRAL_KASANDA: 'CENTRAL POLICE STATION KASANDA',
  CENTRAL_KIBOGA: 'CENTRAL POLICE STATION KIBOGA',
  CENTRAL_MUBENDE: 'CENTRAL POLICE STATION MUBENDE',
  CENTRAL_KASESE: 'CENTRAL POLICE STATION KASESE',
  CENTRAL_MPIGI: 'CENTRAL POLICE STATION MPIGI',
  KAMENGO: 'KAMENGO POLICE STATION',
  KIBIBI: 'KIBIBI POLICE STATION',
  MADDU: 'MADDU POLICE STATION',
  JINJA_CENTRAL: 'JINJA CENTRAL POLICE STATION',
  NALUFENYA: 'NALUFENYA POLICE STATION',
  WALUKUBA: 'WALUKUBA POLICE STATION',
  BUGEMBE: 'BUGEMBE POLICE STATION',
  BUWENGE: 'BUWENGE POLICE STATION',
  KAKIRA: 'KAKIRA POLICE STATION',
  JOC_MOYO: 'JOC MOYO',
  MOYO: 'MOYO POLICE STATION',
  OBONGI: 'OBONGI POLICE STATION',
  MOYO_SUB_COUNTY: 'MOYO SUB COUNTY  POLICE STATION',
  ADJUMANI_CENTRAL: 'ADJUMANI CENTRAL POLICE STATION',
  DZAIPI: 'DZAIPI POLICE STATION',
  OFUA: 'OFUA POLICE STATION',
  YUMBE_CENTRAL: 'YUMBE CENTRAL POLICE STATION',
  LODONGA: 'LODONGA POLICE STATION',
  ADIBO: 'ADIBO POLICE STATION',
  RADIO_ROOM_YUMBE: 'RADIO ROOM YUMBE',
  PTS_IKAFERADIO_ROOM: 'PTS IKAFE(RADIO ROOM)',
  TORORO_CENTRAL: 'TORORO CENTRAL POLICE STATION',
  MALABA: 'MALABA POLICE STATION',
  BUSIA_CENTRAL: 'BUSIA CENTRAL POLICE STATION',
  MASAFU: 'MASAFU POLICE STATION',
  BUTALEJA_CENTRAL: 'BUTALEJA CENTRAL POLICE STATION',
  BUSOLWE: 'BUSOLWE POLICE STATION',
  PALLISA_CENTRAL: 'PALLISA CENTRAL POLICE STATION',
  BUDAKA_CENTRAL: 'BUDAKA CENTRAL POLICE STATION',
  KIBUKU_CENTRAL: 'KIBUKU CENTRAL POLICE STATION',
  BUTEBO_CENTRAL: 'BUTEBO CENTRAL POLICE STATION',
  CENTRAL_ARUA: 'CENTRAL POLICE STATION ARUA',
  LIA: 'LIA POLICE STATION',
  VURRA: 'VURRA POLICE STATION',
  RHINOCAMP: 'RHINOCAMP POLICE STATION',
  OMUGO: 'OMUGO POLICE STATION',
  KOBOKO: 'KOBOKO POLICE STATION',
  ORABA: 'ORABA POLICE STATION',
  BUSIA: 'BUSIA POLICE STATION',
  MARACHA: 'MARACHA POLICE STATION',
  NEBBI: 'NEBBI POLICE STATION',
  GOLI: 'GOLI POLICE STATION',
  PAIDHA: 'PAIDHA POLICE STATION',
  ZOMBO: 'ZOMBO POLICE STATION',
  ZEU: 'ZEU POLICE STATION',
  WARR: 'WARR POLICE STATION',
  PAKWACH: 'PAKWACH POLICE STATION',
  PANYIMUR: 'PANYIMUR POLICE STATION',
  LUGAZI: 'LUGAZI POLICE STATION',
  BUIKWE: 'BUIKWE POLICE STATION',
  KIYINDI: 'KIYINDI POLICE STATION',
  MABIRA: 'MABIRA POLICE STATION',
  NGOGWE: 'NGOGWE POLICE STATION',
  KAYUNGA: 'KAYUNGA POLICE STATION',
  BUSAANA: 'BUSAANA POLICE STATION',
  GALILAYA: 'GALILAYA POLICE STATION',
  BUVUMA: 'BUVUMA POLICE STATION',
  NJERU: 'NJERU POLICE STATION',
  BUSHENYI: 'BUSHENYI POLICE STATION',
  RUBIRIZI: 'RUBIRIZI POLICE STATION',
  MITOOMA: 'MITOOMA POLICE STATION',
  SHEEMA: 'SHEEMA POLICE STATION',
  BUHWEJU: 'BUHWEJU POLICE STATION',
  RCO_OFFICE: 'RCO OFFICE',
  CENTRAL_KOTIDO: 'CENTRAL POLICE STATION KOTIDO',
  ABIM_CENTRAL: 'ABIM CENTRAL POLICE STATION',
  CENTRAL_KAABONG: 'CENTRAL POLICE STATION KAABONG',
  KABAROLE_MAIN: 'KABAROLE MAIN POLICE STATION',
  BUNDIBUJO_MAIN_STATION: 'BUNDIBUJO MAIN STATION',
  NYAHUKA: 'NYAHUKA POLICE STATION',
  CENTRAL_KYENJOJO: 'CENTRAL POLICE STATION KYENJOJO',
  BUKONJO: 'BUKONJO POLICE STATION',
  KYARUSHOZI: 'KYARUSHOZI POLICE STATION',
  BUNYANGABO_MAIN_STATION: 'BUNYANGABO MAIN STATION',
  RWIMI: 'RWIMI POLICE STATION',
  RUBONA: 'RUBONA POLICE STATION',
  MBARARA_CENTRAL: 'MBARARA CENTRAL POLICE STATION',
  NTUNGAMO_CENTRAL: 'NTUNGAMO CENTRAL POLICE STATION',
  KIRUHURA_CENTRAL: 'KIRUHURA CENTRAL POLICE STATION',
  IBANDA_CENTRAL: 'IBANDA CENTRAL POLICE STATION',
  ISINGIRO_CENTRAL: 'ISINGIRO CENTRAL POLICE STATION',
  LIRA_CENTRAL: 'LIRA CENTRAL POLICE STATION',
  OJWINA: 'OJWINA POLICE STATION',
  LIRA_BUS_PARK: 'LIRA BUS PARK',
  AKOKORO: 'AKOKORO POLICE STATION',
  APAC: 'APAC POLICE STATION',
  IBUJE: 'IBUJE POLICE STATION',
  NAMBYESO: 'NAMBYESO POLICE STATION',
  KWANIA: 'KWANIA POLICE STATION',
  CAWENTE: 'CAWENTE POLICE STATION',
  ABONGOMOLA: 'ABONGOMOLA POLICE STATION',
  ALEBTONG: 'ALEBTONG POLICE STATION',
  AKURA: 'AKURA POLICE STATION',
  APALA: 'APALA POLICE STATION',
  OMORO: 'OMORO POLICE STATION',
  AKALO: 'AKALO POLICE STATION',
  BAALA: 'BAALA POLICE STATION',
  ABOKE: 'ABOKE POLICE STATION',
  LORO: 'LORO POLICE STATION',
  KAMDINI: 'KAMDINI POLICE STATION',
  MINAKULU: 'MINAKULU POLICE STATION',
  NAMASALE: 'NAMASALE POLICE STATION',
  AGOGA: 'AGOGA POLICE STATION',
  AMOLATAR: 'AMOLATAR POLICE STATION',
  DOKOLO: 'DOKOLO POLICE STATION',
  AGWATA: 'AGWATA POLICE STATION',
  OTUKE: 'OTUKE POLICE STATION',
  OKWANG: 'OKWANG POLICE STATION',
  OLILIM: 'OLILIM POLICE STATION',
  PYAPAK: 'PYAPAK POLICE STATION',
  NABILATUK: 'NABILATUK POLICE STATION',
  MOROTO_BUSPARK: 'MOROTO BUSPARK POLICE STATION',
  MOROTO: 'MOROTO POLICE STATION',
  NAKAPIRIPIRITI: 'NAKAPIRIPIRITI POLICE STATION'
} as const

const nationalityOptions = Object.keys(NATIONALITY).map((nat) => ({
  value: nat,
  label: {
    defaultMessage: nat,
    description: `label for ${nat}`,
    id: `nationality.${nat}`
  }
}))

const policeStationOptions = Object.keys(POLICESTATIONS).map((station) => ({
  value: POLICESTATIONS[station as keyof typeof POLICESTATIONS],
  label: {
    defaultMessage: POLICESTATIONS[station as keyof typeof POLICESTATIONS],
    description: `label for ${station}`,
    id: `policeStation.${station}`
  }
}));

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
            required: true,
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
            name: 'policeStationName',
            type: SELECT_WITH_OPTIONS,
            label: userFormMessages.policeStationName,
            required: true,
            initialValue: '',
            conditionals: [
              {
                action: 'hide',
                expression: 'values.role !== "POLICE_INCHARGE"'
              }
            ],
            validator: [],
            placeholder: userFormMessages.formSelectPlaceholder,
            options: policeStationOptions,
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
