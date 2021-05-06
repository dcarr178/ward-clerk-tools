"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.writeAttendanceFile = exports.writeCallingsFile = void 0;
const tslib_1 = require("tslib");
const lcr_api_1 = require("./lcr-api");
const d3_dsv_1 = require("d3-dsv");
const fs_1 = require("fs");
const extractCallingInfo = (orgName, calling) => {
    return {
        Name: calling.memberName,
        Position: calling.position,
        Organization: orgName,
        "Set Apart": calling.setApart,
        "Date Called": calling.activeDate
    };
};
const writeCallingsFile = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const outputFilePath = "./data/callings.csv";
    // get data
    const callings = yield lcr_api_1.fetchCallings();
    // organize data
    const callingList = [];
    for (const org of callings) {
        for (const calling of org.callings) {
            if (calling.mrn)
                callingList.push(extractCallingInfo(org.name, calling));
        }
        for (const childOrg of org.children) {
            for (const calling of childOrg.callings) {
                if (calling.mrn)
                    callingList.push(extractCallingInfo(org.name, calling));
            }
        }
    }
    // write file
    const csv = d3_dsv_1.csvFormat(callingList);
    fs_1.writeFileSync(outputFilePath, csv);
    console.log(`callings file has been written to ${outputFilePath}`);
});
exports.writeCallingsFile = writeCallingsFile;
const writeAttendanceFile = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const outputFilePath = "./data/attendance.csv";
    const attendance = yield lcr_api_1.fetchClassAttendance();
    const members = lcr_api_1.parseClassAttendance(attendance);
    // write file
    const csv = d3_dsv_1.csvFormat(members);
    fs_1.writeFileSync(outputFilePath, csv);
    console.log(`attendance file has been written to ${outputFilePath}`);
});
exports.writeAttendanceFile = writeAttendanceFile;
const run = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    // out of unit callings https://lcr.churchofjesuschrist.org/services/orgs/out-of-unit-callings?includeTypes=LIVING_INSIDE&lang=eng&unitNumber=374938
});
exports.run = run;
