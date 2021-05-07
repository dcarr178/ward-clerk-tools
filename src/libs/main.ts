import { fetchMembershipList, fetchClassAttendance, fetchCallings2 } from './lcr-api'
import { csvFormat } from 'd3-dsv'
import { writeFileSync, readdirSync } from "fs";
import { MemberRecord } from "./types/membership-list";
import { AttendanceProps } from "./types/attendance";
import TextFileDiff from 'text-file-diff';
import { Calling as MemberCalling} from './types/members-with-callings'

interface CallingMemberList {
  Name: string
  "Has attended": boolean
  Organization: string
  Class: string
}
interface OrgList {
  [orgId: string]: {
    org: string,
    suborg: string
  }
}

const parseClassAttendance = (attendanceProps: AttendanceProps): CallingMemberList[] => {

  // parse orgs
  const orgList: OrgList = {}
  for (const org of attendanceProps.props.pageProps.initialProps.rootUnitOrgNodes) {
    orgList[org.unitOrgUuid] = {
      org: org.unitOrgName,
      suborg: ""
    }
    if (org.children) {
      for (const suborg of org.children) {
        orgList[suborg.unitOrgUuid] = {
          org: org.unitOrgName,
          suborg: suborg.unitOrgName
        }
      }
    }
  }

  // calculate member attendance
  const memberList: CallingMemberList[] = []
  for (const member of attendanceProps.props.pageProps.initialProps.attendees) {
    let hasAttended = false
    for (const entry of member.entries) {
      if (entry.isMarkedAttended) hasAttended = true
    }

    for (const orgId of member.unitOrgsCombined) {
      memberList.push({
        Name: member.displayName,
        "Has attended": hasAttended,
        Organization: orgList[orgId]?.org,
        "Class": orgList[orgId]?.suborg
      })
    }
  }
  return memberList
}

export const writeCallingsFile2 = async (outputFilePath = "./data/members-with-callings.csv"): Promise<void> => {

  // get data
  const callings = await fetchCallings2()

  // organize data
  const callingList = []
  for (const calling of callings) {
    callingList.push({
      Name: calling.name,
      Unit: calling.unitName,
      Organization: calling.organization,
      Position: calling.position,
      "Set Apart": calling.setApart,
      "Date Called": calling.activeDate.substring(0,10)
    })
  }

  // write file
  const csv = csvFormat(callingList)
  writeFileSync(outputFilePath, csv)
  console.log(`callings file has been written to ${outputFilePath}`)
}

export const writeAttendanceFile = async (outputFilePath = "./data/attendance.csv"): Promise<void> => {

  const attendance = await fetchClassAttendance()
  const members = parseClassAttendance(attendance)

  // write file
  const csv = csvFormat(members)
  writeFileSync(outputFilePath, csv)
  console.log(`attendance file has been written to ${outputFilePath}`)

}

const diffLastTwoMemberLists = async () => {
  const memberFiles = readdirSync('./data/').filter(f => f.includes('members.')).sort().reverse()
  if (memberFiles.length < 2) {
    console.log(`Cannot compare member lists until there are 2 files`)
    process.exit()
  }

  // configure the diff
  const m = new TextFileDiff()
  const membersIn: string[] = []
  const membersOut: string[] = []
  m.on('-', line => {
    membersOut.push(line)
  })
  m.on('+', line => {
    membersIn.push(line)
  })

  // run the diff
  await m.diff(`./data/${memberFiles[1]}`, `./data/${memberFiles[0]}`);
  return {
    membersIn,
    membersOut
  }
}

const diffLastTwoCallingLists = async () => {
  const files = readdirSync('./data/').filter(f => f.includes('calling-list.')).sort().reverse()
  if (files.length < 2) {
    console.log(`Cannot compare calling lists until there are 2 files`)
    process.exit()
  }

  // configure the diff
  const n = new TextFileDiff()
  const newCallings: string[] = []
  const releases: string[] = []
  n.on('-', line => {
    releases.push(line)
  })
  n.on('+', line => {
    newCallings.push(line)
  })

  // run the diff
  await n.diff(`./data/${files[1]}`, `./data/${files[0]}`);
  return {
    callings: newCallings,
    releases: releases
  }
}

const writeSortedDatedMemberList = (membershipList: MemberRecord[]) => {
  const formattedDate = Math.round(Date.now() / 1000)
  const outputFilePath = `./data/members.${formattedDate}.txt`
  const members: string[] = []
  for (const member of membershipList) {
    members.push(`${member.nameListPreferredLocal} (${member.age}) ${member.address.addressLines.join(', ')}`)
  }
  writeFileSync(outputFilePath, members.sort().join("\n"))
}

const writeSortedDatedCallingList = (callingList: MemberCalling[]) => {
  const formattedDate = Math.round(Date.now() / 1000)
  const outputFilePath = `./data/calling-list.${formattedDate}.txt`
  const callings: string[] = []
  for (const c of callingList) {
    callings.push(`${c.name} - ${c.unitName} - ${c.organization} - ${c.position}`)
  }
  writeFileSync(outputFilePath, callings.sort().join("\n"))
}

export const run = async (): Promise<void> => {

  // get latest member list
  const memberList = await fetchMembershipList()
  writeSortedDatedMemberList(memberList)

  let body = ""
  const { membersIn, membersOut } = await diffLastTwoMemberLists()
  if (membersIn.length > 0) {
    body += ["NEW WARD MEMBERS", "----------------"].join("\n") + "\n"
    body += membersIn.join("\n") + "\n\n"
  }
  if (membersOut.length > 0) {
    body += ["MEMBERS MOVED OUT OF WARD", "-------------------------"].join("\n") + "\n"
    body += membersOut.join("\n") + "\n\n"
  }

  // get latest calling list
  const callingList = await fetchCallings2()
  writeSortedDatedCallingList(callingList)
  const { callings, releases } = await diffLastTwoCallingLists()

  if (callings.length > 0) {
    body += ["NEW CALLINGS", "------------"].join("\n") + "\n"
    body += callings.join("\n") + "\n\n"
  }
  if (releases.length > 0) {
    body += ["NEW RELEASES", "------------"].join("\n") + "\n"
    body += releases.join("\n") + "\n\n"
  }

  if (body) {
    // TODO now that I know membersIn, membersOut, callings, and releases now I have to send email
    console.log(body)
  } else {
    console.log(`no ward changes found`)
  }

}
