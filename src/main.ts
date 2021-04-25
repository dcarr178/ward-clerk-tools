import { fetchMembershipListToDataFile } from "./cypress"
import { readFileSync } from 'fs'
import { MemberRecord, CypressData } from './types/membership-list'

const fetchMembershipListFromDataFile = (): MemberRecord[] => {
  const dataPath = "./cypress-data.json"
  const buffer = readFileSync(dataPath)
  const cypressData: CypressData = JSON.parse(buffer.toString())
  const memberList = cypressData.memberList.response.body
  return memberList
}

export const run = async (): Promise<void> => {
  await fetchMembershipListToDataFile()
  const memberList = fetchMembershipListFromDataFile()
  for (const member of memberList) {
    console.log(member.nameGivenPreferredLocal)
  }
}
