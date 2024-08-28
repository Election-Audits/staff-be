/*
NB: Do not put secrets in this file. Instead use a secrets manager like Infisical
Only load config variables here
*/

export const BUILD = process.env.BUILD; // one of constants.BUILD_TYPES
export const NODE_ENV = process.env.NODE_ENV;
export const DBS = process.env.DBS; // mongo dbs to connect to

// alert user if environment variables not set
if (!BUILD) throw new Error("Must set environment variable BUILD");
if (!NODE_ENV) throw new Error("Must set environment variable NODE_ENV");
if (!DBS) throw new Error("Must set environment variable DBS, name(s) of database(s) to connect to");
