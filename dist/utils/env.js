"use strict";
/*
NB: Do not put secrets in this file. Instead use a secrets manager like Infisical
Only load config variables here
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_PASSWORD = exports.EMAIL_USER = exports.MONGO_LOCAL_CREDS = exports.INFISICAL_PROJECT_ID = exports.INFISICAL_SECRET = exports.INFISICAL_ID = exports.DBS = exports.NODE_ENV = exports.BUILD = void 0;
const constants_1 = require("shared-lib/constants");
exports.BUILD = process.env.BUILD; // one of constants.BUILD_TYPES
exports.NODE_ENV = process.env.NODE_ENV;
exports.DBS = process.env.DBS; // mongo dbs to connect to
exports.INFISICAL_ID = process.env.INFISICAL_ID;
exports.INFISICAL_SECRET = process.env.INFISICAL_SECRET;
exports.INFISICAL_PROJECT_ID = process.env.INFISICAL_PROJECT_ID;
exports.MONGO_LOCAL_CREDS = process.env.MONGO_LOCAL_CREDS; // pass Mongo credentials for local build
// environment variables set in local build
exports.EMAIL_USER = process.env.EMAIL_USER;
exports.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
// alert user if environment variables not set
if (!exports.BUILD)
    throw new Error("Must set environment variable BUILD");
if (!exports.NODE_ENV)
    throw new Error("Must set environment variable NODE_ENV");
if (!exports.DBS)
    throw new Error("Must set environment variable DBS, name(s) of database(s) to connect to");
// Errors to be thrown when running in cloud
if (exports.BUILD == constants_1.BUILD_TYPES.cloud) {
    if (!exports.INFISICAL_ID)
        throw new Error("Must set environment variable INFISICAL_ID");
    if (!exports.INFISICAL_SECRET)
        throw new Error("Must set environment variable INFISICAL_SECRET");
    if (!exports.INFISICAL_PROJECT_ID)
        throw new Error("Must set environment variable INFISICAL_PROJECT_ID");
}
/*
Other envs not checked here
DOTENV_CONFIG_PATH
*/
