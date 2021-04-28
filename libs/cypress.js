"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLoginData = void 0;
const tslib_1 = require("tslib");
const dotenv_1 = require("dotenv");
const cypress_1 = tslib_1.__importDefault(require("cypress"));
dotenv_1.config();
const updateLoginData = () => {
    // The purpose of running cypress is to execute the lds authentication saml process in a browser and capture
    // valid, authenticated request headers that we can use in future api calls.
    console.log(`updating login`);
    return cypress_1.default
        .run({
        spec: './src/cypress-tests/membership-list_spec.js',
        env: {
            CHURCH_USERNAME: process.env.CHURCH_USERNAME,
            CHURCH_PASSWORD: process.env.CHURCH_PASSWORD
        },
        quiet: true
    })
        .then(() => {
        return; // cypress result object is irrelevant so let's return void
    })
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
};
exports.updateLoginData = updateLoginData;
