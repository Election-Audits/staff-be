'use strict';

/*
NB: Do not put secrets in this file. Instead use a secrets manager like Infisical
Only load config variables here
*/

const { BUILD_TYPES } = require('shared-lib/constants');

const BUILD = process.env.BUILD; // one of constants.BUILD_TYPES
const NODE_ENV = process.env.NODE_ENV;
const DBS = process.env.DBS; // mongo dbs to connect to
const INFISICAL_ID = process.env.INFISICAL_ID;
const INFISICAL_SECRET = process.env.INFISICAL_SECRET;
const INFISICAL_PROJECT_ID = process.env.INFISICAL_PROJECT_ID;
const MONGO_LOCAL_CREDS = process.env.MONGO_LOCAL_CREDS; // pass Mongo credentials for local build

// environment variables set in local build
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const COOKIE_SECRET = process.env.COOKIE_SECRET;


// alert user if environment variables not set
if (!BUILD) throw new Error("Must set environment variable BUILD");
if (!NODE_ENV) throw new Error("Must set environment variable NODE_ENV");
if (!DBS) throw new Error("Must set environment variable DBS, name(s) of database(s) to connect to");

// Errors to be thrown when running in cloud
if (BUILD == BUILD_TYPES.cloud) {
    if (!INFISICAL_ID) throw new Error("Must set environment variable INFISICAL_ID");
    if (!INFISICAL_SECRET) throw new Error("Must set environment variable INFISICAL_SECRET");
    if (!INFISICAL_PROJECT_ID) throw new Error("Must set environment variable INFISICAL_PROJECT_ID");
}


/*
Other envs not checked here
DOTENV_CONFIG_PATH
*/


module.exports = {
    BUILD,
    NODE_ENV,
    DBS,
    INFISICAL_ID,
    INFISICAL_SECRET,
    INFISICAL_PROJECT_ID,
    MONGO_LOCAL_CREDS,
    EMAIL_USER,
    EMAIL_PASSWORD,
    COOKIE_SECRET
};
