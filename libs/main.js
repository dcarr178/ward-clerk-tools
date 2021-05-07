"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.writeAttendanceFile = exports.writeCallingsFile2 = void 0;
const tslib_1 = require("tslib");
const lcr_api_1 = require("./lcr-api");
const d3_dsv_1 = require("d3-dsv");
const fs_1 = require("fs");
const text_file_diff_1 = tslib_1.__importDefault(require("text-file-diff"));
const parseClassAttendance = (attendanceProps) => {
    var _a, _b;
    // parse orgs
    const orgList = {};
    for (const org of attendanceProps.props.pageProps.initialProps.rootUnitOrgNodes) {
        orgList[org.unitOrgUuid] = {
            org: org.unitOrgName,
            suborg: ""
        };
        if (org.children) {
            for (const suborg of org.children) {
                orgList[suborg.unitOrgUuid] = {
                    org: org.unitOrgName,
                    suborg: suborg.unitOrgName
                };
            }
        }
    }
    // calculate member attendance
    const memberList = [];
    for (const member of attendanceProps.props.pageProps.initialProps.attendees) {
        let hasAttended = false;
        for (const entry of member.entries) {
            if (entry.isMarkedAttended)
                hasAttended = true;
        }
        for (const orgId of member.unitOrgsCombined) {
            memberList.push({
                Name: member.displayName,
                "Has attended": hasAttended,
                Organization: (_a = orgList[orgId]) === null || _a === void 0 ? void 0 : _a.org,
                "Class": (_b = orgList[orgId]) === null || _b === void 0 ? void 0 : _b.suborg
            });
        }
    }
    return memberList;
};
const writeCallingsFile2 = (outputFilePath = "./data/members-with-callings.csv") => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    // get data
    const callings = yield lcr_api_1.fetchCallings2();
    // organize data
    const callingList = [];
    for (const calling of callings) {
        callingList.push({
            Name: calling.name,
            Unit: calling.unitName,
            Organization: calling.organization,
            Position: calling.position,
            "Set Apart": calling.setApart,
            "Date Called": calling.activeDate.substring(0, 10)
        });
    }
    // write file
    const csv = d3_dsv_1.csvFormat(callingList);
    fs_1.writeFileSync(outputFilePath, csv);
    console.log(`callings file has been written to ${outputFilePath}`);
});
exports.writeCallingsFile2 = writeCallingsFile2;
const writeAttendanceFile = (outputFilePath = "./data/attendance.csv") => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const attendance = yield lcr_api_1.fetchClassAttendance();
    const members = parseClassAttendance(attendance);
    // write file
    const csv = d3_dsv_1.csvFormat(members);
    fs_1.writeFileSync(outputFilePath, csv);
    console.log(`attendance file has been written to ${outputFilePath}`);
});
exports.writeAttendanceFile = writeAttendanceFile;
const diffLastTwoMemberLists = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const memberFiles = fs_1.readdirSync('./data/').filter(f => f.includes('members.')).sort().reverse();
    if (memberFiles.length < 2) {
        console.log(`Cannot compare member lists until there are 2 files`);
        process.exit();
    }
    // configure the diff
    const m = new text_file_diff_1.default();
    const membersIn = [];
    const membersOut = [];
    m.on('-', line => {
        membersOut.push(line);
    });
    m.on('+', line => {
        membersIn.push(line);
    });
    // run the diff
    yield m.diff(`./data/${memberFiles[1]}`, `./data/${memberFiles[0]}`);
    return {
        membersIn,
        membersOut
    };
});
const diffLastTwoCallingLists = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const files = fs_1.readdirSync('./data/').filter(f => f.includes('calling-list.')).sort().reverse();
    if (files.length < 2) {
        console.log(`Cannot compare calling lists until there are 2 files`);
        process.exit();
    }
    // configure the diff
    const n = new text_file_diff_1.default();
    const newCallings = [];
    const releases = [];
    n.on('-', line => {
        releases.push(line);
    });
    n.on('+', line => {
        newCallings.push(line);
    });
    // run the diff
    yield n.diff(`./data/${files[1]}`, `./data/${files[0]}`);
    return {
        callings: newCallings,
        releases: releases
    };
});
const writeSortedDatedMemberList = (membershipList) => {
    const formattedDate = Math.round(Date.now() / 1000);
    const outputFilePath = `./data/members.${formattedDate}.txt`;
    const members = [];
    for (const member of membershipList) {
        members.push(`${member.nameListPreferredLocal} (${member.age}) ${member.address.addressLines.join(', ')}`);
    }
    fs_1.writeFileSync(outputFilePath, members.sort().join("\n"));
};
const writeSortedDatedCallingList = (callingList) => {
    const formattedDate = Math.round(Date.now() / 1000);
    const outputFilePath = `./data/calling-list.${formattedDate}.txt`;
    const callings = [];
    for (const c of callingList) {
        callings.push(`${c.name} - ${c.unitName} - ${c.organization} - ${c.position}`);
    }
    fs_1.writeFileSync(outputFilePath, callings.sort().join("\n"));
};
const run = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    // get latest member list
    const memberList = yield lcr_api_1.fetchMembershipList();
    writeSortedDatedMemberList(memberList);
    let body = "";
    const { membersIn, membersOut } = yield diffLastTwoMemberLists();
    if (membersIn.length > 0) {
        body += ["NEW WARD MEMBERS", "----------------"].join("\n") + "\n";
        body += membersIn.join("\n") + "\n\n";
    }
    if (membersOut.length > 0) {
        body += ["MEMBERS MOVED OUT OF WARD", "-------------------------"].join("\n") + "\n";
        body += membersOut.join("\n") + "\n\n";
    }
    // get latest calling list
    const callingList = yield lcr_api_1.fetchCallings2();
    writeSortedDatedCallingList(callingList);
    const { callings, releases } = yield diffLastTwoCallingLists();
    if (callings.length > 0) {
        body += ["NEW CALLINGS", "------------"].join("\n") + "\n";
        body += callings.join("\n") + "\n\n";
    }
    if (releases.length > 0) {
        body += ["NEW RELEASES", "------------"].join("\n") + "\n";
        body += releases.join("\n") + "\n\n";
    }
    if (body) {
        // TODO now that I know membersIn, membersOut, callings, and releases now I have to send email
        console.log(body);
    }
    else {
        console.log(`no ward changes found`);
    }
});
exports.run = run;
