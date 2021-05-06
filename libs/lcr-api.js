"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClassAttendance = exports.fetchClassAttendance = exports.fetchCallings = exports.fetchMembershipList = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const cypress_1 = require("./cypress");
const axios_1 = tslib_1.__importDefault(require("axios"));
const node_html_parser_1 = require("node-html-parser");
const _loginData = {
    unitNumber: 0,
    requestHeaders: {}
};
// utility functions
const loginData = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    if (!_loginData.unitNumber) {
        // fetch login data from disk
        const result = yield fetchLoginData();
        _loginData.unitNumber = result.unitNumber;
        _loginData.requestHeaders = result.requestHeaders;
    }
    return _loginData;
});
const fetchLoginData = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const loginDataPath = "./data/login.json";
    if (!fs_1.existsSync(loginDataPath)) {
        console.log(`no login file found`);
        yield updateLogin();
    }
    return JSON.parse(fs_1.readFileSync(loginDataPath).toString());
});
let updatedLogin = false;
const updateLogin = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    if (updatedLogin) {
        console.log(`login already tried once, exiting now`);
        process.exit(1);
    }
    else {
        updatedLogin = true;
        _loginData.unitNumber = 0;
        return cypress_1.updateLoginData();
    }
});
// LCR api endpoints
const lcrAPI = axios_1.default.create({
    baseURL: 'https://lcr.churchofjesuschrist.org/',
    timeout: 30000
});
const fetchMembershipList = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const login = yield loginData();
    const apiPath = `services/umlu/report/member-list?lang=eng&unitNumber=${login.unitNumber}`;
    console.log(`fetching membership list`);
    const membershipList = yield lcrAPI.get(apiPath, {
        headers: login.requestHeaders
    })
        .then(res => res.data);
    if (Array.isArray(membershipList)) {
        fs_1.writeFileSync("./data/membership-list.json", JSON.stringify(membershipList, null, 2));
        return membershipList;
    }
    // response is not array so loginData is invalid and needs to be updated
    console.log(`fetch membership list failed`);
    yield updateLogin();
    return exports.fetchMembershipList();
});
exports.fetchMembershipList = fetchMembershipList;
const fetchCallings = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const login = yield loginData();
    const apiPath = `services/orgs/sub-orgs-with-callings?ip=true&lang=eng`;
    console.log(`fetching callings list`);
    const callings = yield lcrAPI.get(apiPath, {
        headers: login.requestHeaders
    })
        .then(res => res.data);
    if (Array.isArray(callings)) {
        fs_1.writeFileSync("./data/callings.json", JSON.stringify(callings, null, 2));
        return callings;
    }
    // response is not array so loginData is invalid and needs to be updated
    console.log(`fetch callings failed`);
    yield updateLogin();
    return exports.fetchCallings();
});
exports.fetchCallings = fetchCallings;
const fetchClassAttendance = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const login = yield loginData();
    const apiPath = `report/class-and-quorum-attendance/overview?lang=eng`;
    console.log(`fetching class attendance`);
    const html = yield lcrAPI.get(apiPath, {
        headers: login.requestHeaders
    })
        .then(res => res.data);
    fs_1.writeFileSync("./data/attendance.html", html);
    // parse html
    const dom = node_html_parser_1.parse(html);
    // parse script tag out of html
    const jsText = (_a = dom.querySelector('#__NEXT_DATA__')) === null || _a === void 0 ? void 0 : _a.innerText;
    if (!jsText) {
        console.log(`fetch class attendance failed`);
        yield updateLogin();
        return exports.fetchClassAttendance();
    }
    const attendanceProps = JSON.parse(jsText);
    fs_1.writeFileSync("./data/attendance.json", JSON.stringify(attendanceProps, null, 2));
    return attendanceProps;
});
exports.fetchClassAttendance = fetchClassAttendance;
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
exports.parseClassAttendance = parseClassAttendance;
