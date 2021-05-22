"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.diffMembersAndCallings = exports.writeAttendanceFile = exports.writeCallingsFile2 = void 0;
const tslib_1 = require("tslib");
const lcr_api_1 = require("./lcr-api");
const d3_dsv_1 = require("d3-dsv");
const fs_1 = require("fs");
const text_file_diff_1 = tslib_1.__importDefault(require("text-file-diff"));
const webhook_1 = require("@slack/webhook");
const mail_1 = tslib_1.__importDefault(require("@sendgrid/mail"));
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
        // do not include age or else you'll get a diff every time someone has a birthday
        members.push(`${member.nameListPreferredLocal} ${member.address.addressLines.join(', ')}`);
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
const diffMembersAndCallings = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    // get latest member list
    const memberList = yield lcr_api_1.fetchMembershipList();
    writeSortedDatedMemberList(memberList);
    const { membersIn, membersOut } = yield diffLastTwoMemberLists();
    // get latest calling list
    const callingList = yield lcr_api_1.fetchCallings2();
    writeSortedDatedCallingList(callingList);
    const { callings, releases } = yield diffLastTwoCallingLists();
    yield postToSlack(membersIn, membersOut, callings, releases);
    yield sendEmail(membersIn, membersOut, callings, releases);
});
exports.diffMembersAndCallings = diffMembersAndCallings;
const slackMessage = (title, data) => {
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
    };
};
const postToSlack = (membersIn, membersOut, callings, releases) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const url = process.env.SLACK_WEBHOOK_URL;
    const promises = [];
    if (url) {
        const webhook = new webhook_1.IncomingWebhook(url);
        if (membersIn.length)
            promises.push(webhook.send(slackMessage("Members moved into ward", membersIn)));
        if (membersOut.length)
            promises.push(webhook.send(slackMessage("Members moved out of ward", membersOut)));
        if (callings.length)
            promises.push(webhook.send(slackMessage("New callings", callings)));
        if (releases.length)
            promises.push(webhook.send(slackMessage("New releases", releases)));
    }
    return Promise.all(promises);
});
const sendEmail = (membersIn, membersOut, callings, releases) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const sendgridAPIKey = process.env.SENDGRID_API_KEY;
    const sender = process.env.VERIFIED_SENDGRID_SENDER_EMAIL || "";
    const emailTo = (process.env.SEND_EMAIL_TO || "").split(";");
    let emailText = "";
    let emailHTML = "";
    if (membersIn.length > 0) {
        emailText += ["NEW WARD MEMBERS", "----------------"].join("\n") + "\n";
        emailText += membersIn.join("\n") + "\n\n";
        emailHTML += `<h1><b>New ward members</b></h1><p>` + membersIn.join("</p><p>") + "</p>";
    }
    if (membersOut.length > 0) {
        emailText += ["MEMBERS MOVED OUT OF WARD", "-------------------------"].join("\n") + "\n";
        emailText += membersOut.join("\n") + "\n\n";
        emailHTML += `<h1><b>Members moved out of ward</b></h1><p>` + membersOut.join("</p><p>") + "</p>";
    }
    if (callings.length > 0) {
        emailText += ["NEW CALLINGS", "------------"].join("\n") + "\n";
        emailText += callings.join("\n") + "\n\n";
        emailHTML += `<h1><b>New callings</b></h1><p>` + callings.join("</p><p>") + "</p>";
    }
    if (releases.length > 0) {
        emailText += ["NEW RELEASES", "------------"].join("\n") + "\n";
        emailText += releases.join("\n") + "\n\n";
        emailHTML += `<h1><b>New releases</b></h1><p>` + releases.join("</p><p>") + "</p>";
    }
    if (emailText && sendgridAPIKey) {
        console.log(emailText);
        mail_1.default.setApiKey(sendgridAPIKey);
        const msg = {
            to: emailTo,
            from: sender,
            subject: 'Ward member changes were detected in LCR',
            text: emailText,
            html: emailHTML,
        };
        return mail_1.default
            .send(msg)
            .then(() => {
            console.log(`Email sent to ${emailTo}`);
        })
            .catch((error) => {
            console.error(error);
        });
    }
    else {
        console.log(`no ward changes found`);
    }
});
const run = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    console.log('No test code configured');
});
exports.run = run;
