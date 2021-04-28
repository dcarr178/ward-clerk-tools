import { existsSync, readFileSync, writeFileSync } from 'fs'
import { updateLoginData } from './cypress'
import { LoginData } from './types/lcr-api'
import { MemberRecord } from './types/membership-list'
import axios from "axios"
import { Organization } from "./types/callings";

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

const updateLogin = async () => {
  _loginData.unitNumber = 0
  return updateLoginData()
}

// LCR api endpoints
const lcrAPI = axios.create({
  baseURL: 'https://lcr.churchofjesuschrist.org/services/',
  timeout: 30000
})

export const fetchMembershipList = async (): Promise<MemberRecord[]> => {
  const login = await loginData()
  const apiPath = `umlu/report/member-list?lang=eng&unitNumber=${login.unitNumber}`
  console.log(`fetching membership list`)
  const membershipList: MemberRecord[] = await lcrAPI.get(apiPath, {
    headers: login.requestHeaders
  })
    .then(res => res.data)
  if (Array.isArray(membershipList)) {
    writeFileSync("./data/membership-list.json", JSON.stringify(membershipList, null, 2))
    return membershipList
  }

  // response is not array so loginData is invalid and needs to be updated
  console.log(`fetch membership list failed`)
  await updateLogin()
  return fetchMembershipList()

}

export const fetchCallings = async (): Promise<Organization[]> => {
  const login = await loginData()
  const apiPath = `orgs/sub-orgs-with-callings?ip=true&lang=eng`
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
