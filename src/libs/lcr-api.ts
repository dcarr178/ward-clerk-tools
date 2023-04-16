import { existsSync, readFileSync, writeFileSync } from 'fs'
import { updateLoginData } from './cypress'
import { LoginData } from './types/lcr-api'
import { MemberRecord } from './types/membership-list'
import axios from "axios"
import { Organization } from "./types/callings";
import { parse as parseHtml } from 'node-html-parser'
import { AttendanceProps } from './types/attendance'
import { Calling } from './types/members-with-callings'

const _loginData: LoginData = {
  unitNumber: 0,
  requestHeaders: {}
}

// utility functions
const loginData = async (): Promise<LoginData> => {
  if (!_loginData.unitNumber) {
    // fetch login data from disk
    const result = await fetchLoginData()
    _loginData.unitNumber = result.unitNumber
    _loginData.requestHeaders = result.requestHeaders
  }
  return _loginData
}

const fetchLoginData = async (): Promise<LoginData> => {
  const loginDataPath = "./data/login.json"
  if (!existsSync(loginDataPath)) {
    console.log(`no login file found`)
    await updateLogin()
  }
  return JSON.parse(readFileSync(loginDataPath).toString())
}

let updatedLogin = false
const updateLogin = async () => {
  if (updatedLogin) {
    console.log(`login already tried once, exiting now`)
    process.exit(1)
  } else {
    updatedLogin = true
    _loginData.unitNumber = 0
    return updateLoginData()
  }
}

// LCR api endpoints
const lcrAPI = axios.create({
  baseURL: 'https://lcr.churchofjesuschrist.org/',
  timeout: 30000
})

export const fetchMembershipList = async (): Promise<MemberRecord[]> => {
  const login = await loginData()
  const apiPath = `api/umlu/report/member-list?lang=eng&unitNumber=${login.unitNumber}`
  console.log(`fetching membership list`)
  const membershipList: MemberRecord[] = await lcrAPI.get(apiPath, {
    headers: login.requestHeaders
  })
    .then(res => res.data)
    .catch(e => {
      console.log("ERROR fetching membership list")
    })
  if (Array.isArray(membershipList)) {
    writeFileSync("./data/membership-list.json", JSON.stringify(membershipList, null, 2))
    return membershipList
  }

  // response is not array so loginData is invalid and needs to be updated
  console.log(`fetch membership list failed`)
  await updateLogin()
  return fetchMembershipList()

}

export const fetchCallings2 = async (): Promise<Calling[]> => {
  const login = await loginData()

  const apiPath = `api/report/members-with-callings?lang=eng&unitNumber=${login.unitNumber}`
  console.log(`fetching callings list`)
  const callings: Calling[] = await lcrAPI.get(apiPath, {
    headers: login.requestHeaders
  })
    .then(res => res.data)
  if (Array.isArray(callings)) {
    writeFileSync("./data/callings.json", JSON.stringify(callings, null, 2))
    return callings
  }

  // response is not array so loginData is invalid and needs to be updated
  console.log(`fetch callings failed`)
  await updateLogin()
  return fetchCallings2()

}

export const fetchCallings = async (): Promise<Organization[]> => {
  const login = await loginData()

  // this one includes missionaries
  // Request URL: https://lcr.churchofjesuschrist.org/services/report/members-with-callings?lang=eng&unitNumber=374938
  const apiPath = `services/orgs/sub-orgs-with-callings?ip=true&lang=eng`
  console.log(`fetching callings list`)
  const callings: Organization[] = await lcrAPI.get(apiPath, {
    headers: login.requestHeaders
  })
    .then(res => res.data)
  if (Array.isArray(callings)) {
    writeFileSync("./data/callings.json", JSON.stringify(callings, null, 2))
    return callings
  }


  // response is not array so loginData is invalid and needs to be updated
  console.log(`fetch callings failed`)
  await updateLogin()
  return fetchCallings()

}

export const fetchClassAttendance = async (): Promise<AttendanceProps> => {
  const login = await loginData()
  const apiPath = `report/class-and-quorum-attendance/overview?lang=eng`
  console.log(`fetching class attendance`)
  const html: string = await lcrAPI.get(apiPath, {
    headers: login.requestHeaders
  })
    .then(res => res.data)
  writeFileSync("./data/attendance.html", html)

  // parse html
  const dom = parseHtml(html)

  // parse script tag out of html
  const jsText = dom.querySelector('#__NEXT_DATA__')?.innerText

  if (!jsText) {
    console.log(`fetch class attendance failed`)
    await updateLogin()
    return fetchClassAttendance()
  }

  const attendanceProps: AttendanceProps = JSON.parse(jsText)
  writeFileSync("./data/attendance.json", JSON.stringify(attendanceProps, null, 2))
  return attendanceProps

}


