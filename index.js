#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./libs/main");
if (process.argv.length < 3) {
    console.log(`Usage: node . callings - creates csv with all ward callings`);
    console.log(`Usage: node . attendance - creates csv with class attendance for this quarter`);
    console.log(`Usage: node . changes - computes changes in membership and callings and posts to slack and email`);
    console.log(`Usage: node . run - test`);
    process.exit(0);
}
switch (process.argv[2]) {
    case "callings": {
        main_1.writeCallingsFile2();
        break;
    }
    case "attendance": {
        main_1.writeAttendanceFile();
        break;
    }
    case "changes": {
        main_1.diffMembersAndCallings();
        break;
    }
    default: {
        main_1.run();
    }
}
