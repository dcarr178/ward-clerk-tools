import { fetchMembershipList, fetchClassAttendance, fetchCallings2 } from './lcr-api'
import { csvFormat } from 'd3-dsv'
import { writeFileSync, readdirSync } from "fs";
import { MemberRecord } from "./types/membership-list";
import { AttendanceProps } from "./types/attendance";
import TextFileDiff from 'text-file-diff';
import { Calling as MemberCalling} from './types/members-with-callings'
import { IncomingWebhook } from '@slack/webhook'
import sendgridMail from '@sendgrid/mail'

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
    // do not include age or else you'll get a diff every time someone has a birthday
    members.push(`${member.nameListPreferredLocal} ${member.address.addressLines.join(', ')}`)
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

export const diffMembersAndCallings = async () => {

  // get latest member list
  const memberList = await fetchMembershipList()
  writeSortedDatedMemberList(memberList)

  const { membersIn, membersOut } = await diffLastTwoMemberLists()

  // get latest calling list
  const callingList = await fetchCallings2()
  writeSortedDatedCallingList(callingList)
  const { callings, releases } = await diffLastTwoCallingLists()

  await postToSlack(membersIn, membersOut, callings, releases)

  await sendEmail(membersIn, membersOut, callings, releases)

}

const slackMessage = (title: string, data: string[]) => {
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${title}*\n` + data.join("\n")
        }
      }
    ]
  }
}

const postToSlack = async (membersIn: string[], membersOut: string[], callings: string[], releases: string[]) => {
  const url = process.env.SLACK_WEBHOOK_URL
  const promises = []
  if (url) {
    const webhook = new IncomingWebhook(url)
    if (membersIn.length) promises.push(webhook.send(slackMessage("Members moved into ward", membersIn)))
    if (membersOut.length) promises.push(webhook.send(slackMessage("Members moved out of ward", membersOut)))
    if (callings.length) promises.push(webhook.send(slackMessage("New callings", callings)))
    if (releases.length) promises.push(webhook.send(slackMessage("New releases", releases)))
  }
  return Promise.all(promises)
}

const sendEmail = async (membersIn: string[], membersOut: string[], callings: string[], releases: string[]) => {
  const sendgridAPIKey = process.env.SENDGRID_API_KEY
  const sender = process.env.VERIFIED_SENDGRID_SENDER_EMAIL || ""
  const emailTo = (process.env.SEND_EMAIL_TO || "").split(";")
  let emailText = ""
  let emailHTML = ""

  if (membersIn.length > 0) {
    emailText += ["NEW WARD MEMBERS", "----------------"].join("\n") + "\n"
    emailText += membersIn.join("\n") + "\n\n"
    emailHTML += `<h1><b>New ward members</b></h1><p>`+ membersIn.join("</p><p>") + "</p>"
  }
  if (membersOut.length > 0) {
    emailText += ["MEMBERS MOVED OUT OF WARD", "-------------------------"].join("\n") + "\n"
    emailText += membersOut.join("\n") + "\n\n"
    emailHTML += `<h1><b>Members moved out of ward</b></h1><p>`+ membersOut.join("</p><p>") + "</p>"
  }

  if (callings.length > 0) {
    emailText += ["NEW CALLINGS", "------------"].join("\n") + "\n"
    emailText += callings.join("\n") + "\n\n"
    emailHTML += `<h1><b>New callings</b></h1><p>`+ callings.join("</p><p>") + "</p>"
  }
  if (releases.length > 0) {
    emailText += ["NEW RELEASES", "------------"].join("\n") + "\n"
    emailText += releases.join("\n") + "\n\n"
    emailHTML += `<h1><b>New releases</b></h1><p>`+ releases.join("</p><p>") + "</p>"
  }

  if (emailText && sendgridAPIKey) {
    console.log(emailText)
    sendgridMail.setApiKey(sendgridAPIKey)
    const msg = {
      to: emailTo,
      from: sender,
      subject: 'Ward member changes were detected in LCR',
      text: emailText,
      html: emailHTML,
    }
    return sendgridMail
      .send(msg)
      .then(() => {
        console.log(`Email sent to ${emailTo}`)
      })
      .catch((error) => {
        console.error(error)
      })

  } else {
    console.log(`no ward changes found`)
  }
}


export const run = async (): Promise<void> => {

  console.log('No test code configured')

}
