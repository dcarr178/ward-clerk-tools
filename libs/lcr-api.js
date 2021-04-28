"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCallings = exports.fetchMembershipList = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const cypress_1 = require("./cypress");
const axios_1 = tslib_1.__importDefault(require("axios"));
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
const updateLogin = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    _loginData.unitNumber = 0;
    return cypress_1.updateLoginData();
});
// LCR api endpoints
const lcrAPI = axios_1.default.create({
    baseURL: 'https://lcr.churchofjesuschrist.org/services/',
    timeout: 30000
});
const fetchMembershipList = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const login = yield loginData();
    const apiPath = `umlu/report/member-list?lang=eng&unitNumber=${login.unitNumber}`;
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
    const apiPath = `orgs/sub-orgs-with-callings?ip=true&lang=eng`;
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
