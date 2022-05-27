#!/usr/bin/env node
import { run, writeAttendanceFile, writeCallingsFile2, diffMembersAndCallings } from './libs/main'
import { fetchMembershipList } from './libs/lcr-api'

if (process.argv.length < 3) {
  console.log(`Usage: node . callings - creates csv with all ward callings`)
  console.log(`Usage: node . attendance - creates csv with class attendance for this quarter`)
  console.log(`Usage: node . changes - computes changes in membership and callings and posts to slack and email`)
  console.log(`Usage: node . run - test`)
  process.exit(0)
}

switch (process.argv[2]) {
  case "callings": {
    writeCallingsFile2()
    break;
  }
  case "attendance": {
    writeAttendanceFile()
    break;
  }
  case "changes": {
    diffMembersAndCallings()
    break;
  }
  case "membership": {
    fetchMembershipList()
    break;
  }
  default: {
    run()
  }
}
