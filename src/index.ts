#!/usr/bin/env node
import { run, writeAttendanceFile, writeCallingsFile } from './libs/main'

if (process.argv.length < 3) {
  console.log(`Usage: node index.js callings - creates csv with all ward callings`)
  console.log(`Usage: node index.js attendance - creates csv with class attendance for this quarter`)
  console.log(`Usage: node index.js run - test`)
  process.exit(0)
}

switch (process.argv[2]) {
  case "callings": {
    writeCallingsFile()
    break;
  }
  case "attendance": {
    writeAttendanceFile()
    break;
  }
  default: {
    run()
  }
}
