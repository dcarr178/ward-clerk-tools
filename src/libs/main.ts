import { fetchMembershipList, fetchCallings, fetchClassAttendance, parseClassAttendance } from './lcr-api'
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

export const writeAttendanceFile = async () => {
  const outputFilePath = "./data/attendance.csv"

  const attendance = await fetchClassAttendance()
  const members = parseClassAttendance(attendance)

  // write file
  const csv = csvFormat(members)
  writeFileSync(outputFilePath, csv)
  console.log(`attendance file has been written to ${outputFilePath}`)

}

export const run = async (): Promise<void> => {


  // out of unit callings https://lcr.churchofjesuschrist.org/services/orgs/out-of-unit-callings?includeTypes=LIVING_INSIDE&lang=eng&unitNumber=374938

}
