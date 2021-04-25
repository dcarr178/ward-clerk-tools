export interface CypressData {
  urls: string[]
  memberList: MemberList
}

export interface Req {
  headers: RequestHeaders
  url: string
  method: string
  httpVersion: string
  body: string
  responseTimeout: number
}

export interface RequestHeaders {
  host: string
  connection: string
  accept: string
  "user-agent": string
  "sec-fetch-site": string
  "sec-fetch-mode": string
  "sec-fetch-dest": string
  referer: string
  "accept-encoding": string
  "accept-language": string
  cookie: string
}

export interface Response {
  headers: ResponseHeaders
  url: string
  method: any
  httpVersion: string
  statusCode: number
  statusMessage: string
  body: MemberRecord[]
}

export interface ResponseHeaders {
  server: string
  "access-control-allow-credentials": string
  "access-control-allow-headers": string
  "access-control-allow-max-age": string
  "access-control-allow-methods": string
  "access-control-allow-origin": string
  "content-type": string
  pragma: string
  "strict-transport-security": string
  vary: string
  "x-application-context": string
  "x-content-type-options": string
  "x-frame-options": string
  "x-vcap-request-id": string
  "x-xss-protection": string
  "content-encoding": string
  "cache-control": string
  expires: string
  date: string
  "transfer-encoding": string
  connection: string
  "set-cookie": string[]
}

export interface MemberList {
  req: Req
  response: Response
}


export interface MemberRecord {
  nameFormats: NameFormats
  uuid: string
  nameOrder: number
  age: number
  emails?: Email[]
  phones?: Phone[]
  phoneNumber?: string
  priesthoodOffice: string
  membershipUnit: any
  legacyCmisId: number
  sex: string
  unitOrgsCombined?: string[]
  positions: any
  householdMember: HouseholdMember
  personUuid: string
  nameListPreferredLocal: string
  outOfUnitMember: boolean
  unitName: string
  formattedAddress: string
  householdUuid: string
  isProspectiveElder: boolean
  isSingleAdult: boolean
  isYoungSingleAdult: boolean
  householdPhoneNumber?: string
  isHead: boolean
  priesthoodTeacherOrAbove: boolean
  convert: boolean
  householdAnchorPersonUuid: string
  youthBasedOnAge: boolean
  isSpouse: boolean
  member: boolean
  isMember: boolean
  householdNameFamilyLocal: string
  householdRole: string
  email?: string
  houseHoldMemberNameForList: string
  unitNumber: number
  householdEmail?: string
  nameGivenPreferredLocal: string
  householdNameDirectoryLocal: string
  isOutOfUnitMember: boolean
  isAdult: boolean
  nameFamilyPreferredLocal: string
  address: Address2
  birth: Birth
  personStatusFlags: PersonStatusFlags
}

export interface NameFormats {
  listPreferredLocal: string
  givenPreferredLocal: string
  familyPreferredLocal: string
  listPreferred: any
  listOfficial: any
  spokenPreferredLocal: any
}

export interface Email {
  email: string
  ownerType: any
  useType: any
}

export interface Phone {
  number: string
  ownerType: any
  useType: any
}

export interface HouseholdMember {
  householdRole: string
  household: Household
  membershipUnitFlag: boolean
}

export interface Household {
  anchorPerson: AnchorPerson
  uuid: string
  familyNameLocal: string
  directoryPreferredLocal: string
  address: Address
  emails?: Email2[]
  phones?: Phone2[]
  unit: Unit
}

export interface AnchorPerson {
  legacyCmisId: number
  uuid: string
}

export interface Address {
  formattedLine1: string
  formattedLine2: string
  formattedLine3?: string
  formattedLine4: any
  formatted1: any
  formatted2: any
  formatted3: any
  formatted4: any
  addressLines: string[]
  formattedAll: any[]
}

export interface Email2 {
  email: string
  ownerType: any
  useType: any
}

export interface Phone2 {
  number: string
  ownerType: any
  useType: any
}

export interface Unit {
  parentUnit: any
  uuid: any
  unitNumber: number
  nameLocal: string
  unitType: any
  children: any
  positions: any
  cdolLink: any
  adminUnit: any
  addressUnknown: any
}

export interface Address2 {
  formattedLine1: string
  formattedLine2: string
  formattedLine3?: string
  formattedLine4: any
  formatted1: any
  formatted2: any
  formatted3: any
  formatted4: any
  addressLines: string[]
  formattedAll: any[]
}

export interface Birth {
  date: Date
  monthDay: MonthDay
  place: any
  country: any
}

export interface Date {
  date: string
  calc: string
  display: string
}

export interface MonthDay {
  date: string
  calc: string
  display: string
}

export interface PersonStatusFlags {
  member: boolean
  convert: boolean
  adult: boolean
  singleAdult: boolean
  youngSingleAdult: boolean
  prospectiveElder: boolean
  deceased: boolean
}
