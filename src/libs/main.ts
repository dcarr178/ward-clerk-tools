import { fetchMembershipList, fetchCallings } from './lcr-api'
import { tsvFormat, csvFormat } from 'd3-dsv'
import { writeFileSync } from "fs";
import { Calling } from "./types/callings";

const extractCallingInfo = (orgName: string, calling: Calling) => {
  return {
    Name: calling.memberName,
    Position: calling.position,
    Organization: orgName,
    "Set Apart": calling.setApart,
    "Date Called": calling.activeDate
  }
}

export const writeCallingsFile = async () => {
  const outputFilePath = "./data/callings.csv"

  // get data
  const callings = await fetchCallings()

  // organize data
  const callingList = []
  for (const org of callings) {
    for (const calling of org.callings) {
      if (calling.mrn) callingList.push(extractCallingInfo(org.name, calling))
    }
    for (const childOrg of org.children) {
      for (const calling of childOrg.callings) {
        if (calling.mrn) callingList.push(extractCallingInfo(org.name, calling))
      }
    }
  }

  // write file
  const csv = csvFormat(callingList)
  writeFileSync(outputFilePath, csv)
  console.log(`callings file has been written to ${outputFilePath}`)
}

export const run = async (): Promise<void> => {

  // const membershipList = await fetchMembershipList()
  // for (const member of membershipList) {
  //   console.log(member.nameGivenPreferredLocal)
  // }

  // console.log(callings)

  // out of unit callings https://lcr.churchofjesuschrist.org/services/orgs/out-of-unit-callings?includeTypes=LIVING_INSIDE&lang=eng&unitNumber=374938

  // class attendance for one member Request URL: https://lcr.churchofjesuschrist.org/services/umlu/v1/class-and-quorum/attendance/details/df17a7a1-316b-404f-a11f-c7ec7872a333?lang=eng&unitNumber=374938

  // Attendance https://lcr.churchofjesuschrist.org/services/umlu/v1/class-and-quorum/attendance/overview/unitNumber/374938?lang=eng
  // i think we can get class attendance from this
}
