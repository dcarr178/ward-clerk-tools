#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_1 = require("./libs/main");
if (process.argv.length < 3) {
    console.log(`Usage: node index.js callings - creates csv with all ward callings`);
    console.log(`Usage: node index.js attendance - creates csv with class attendance for this quarter`);
    console.log(`Usage: node index.js run - test`);
    process.exit(0);
}
switch (process.argv[2]) {
    case "callings": {
        main_1.writeCallingsFile();
        break;
    }
    case "attendance": {
        main_1.writeAttendanceFile();
        break;
    }
    default: {
        main_1.run();
    }
}
