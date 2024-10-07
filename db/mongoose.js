'use strict';

import * as mongoose from "mongoose";
const debug = require('debug')('ea:mongoose');
debug.log = console.log.bind(console);
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD, INFISICAL_ID, INFISICAL_SECRET, INFISICAL_PROJECT_ID, NODE_ENV, 
    MONGO_LOCAL_CREDS, DBS } from "../utils/env";
import { InfisicalClient, LogLevel, SecretElement } from "@infisical/sdk";
import { auditDbName } from "../utils/misc";


// set connection string depending on whether it's a local or cloud build
const protocol = (BUILD == BUILD_TYPES.local) ? 'mongodb' : 'mongodb+srv';
const mongoUrlBase = (BUILD == BUILD_TYPES.local) ? '127.0.0.1:27017' : ''; // TODO: set cloud urls

let eAuditMongoUrl = ''; // general 'eaudit' db assign in setup
let databaseConns = {}; // database connections


const infisClient = (BUILD == BUILD_TYPES.cloud) ? new InfisicalClient({
    clientId: INFISICAL_ID,
    clientSecret: INFISICAL_SECRET
}) : null;

// setup functions to run
async function setup () {
    // get secrets from Infisical
    let secretsList;// | undefined;
    let secrets = {}; // store secrets to object keyed by secretKey values
    if (BUILD == BUILD_TYPES.cloud) {
        secretsList = await infisClient?.listSecrets({
            projectId: INFISICAL_PROJECT_ID || '',
            environment: getInfisicalEnvSlug(NODE_ENV || '')
        }) || [];
        // debug('list secrets: ', secretsList);
        for (let secretEl of secretsList) {
            secrets[secretEl.secretKey] = secretEl.secretValue;
        }
        // debug('secrets: ', secrets);
    }
    const mongoCreds = (BUILD == BUILD_TYPES.local) ? MONGO_LOCAL_CREDS : 
    `${secrets.MONGO_USER}:${secrets.MONGO_PASSWORD}@`;
    eAuditMongoUrl = `${protocol}://${mongoCreds}${mongoUrlBase}/${auditDbName}`;
    // for each database in DBS, establish a connection
    let mongoOptions = {};
    let dbs = DBS?.split(',') || [];
    let connectFunctions = [];
    for (let db of dbs) {
        let url = `${protocol}://${mongoCreds}${mongoUrlBase}/${db}`;
        debug('mongo url: ', url);
        connectFunctions.push(mongoose.createConnection(url));
    }
    let connectRets = await Promise.all(connectFunctions);
    //debug('connectRets: ', connectRets);
    // save in database connections object
    for (let ind=0; ind<dbs.length; ind++) {
        databaseConns[dbs[ind]] = connectRets[ind];
    }
    isDbConnected = true; // indicate succesful db connection
}

setup();



/**
 * From the environment variable, generate the environment slug for accessing
 * Infisical secrets. e.g. f(development) -> dev
 * @param environment 
 * @returns environment slug
 */
function getInfisicalEnvSlug(environment) {
    let map = {
        development: 'dev',
        production: 'prod',
        staging: 'staging'
    };
    return map[environment];
}


let isDbConnected = false;
/**
 * checks if a database connection has been established
 * @returns a Promise which resolves when database connection is established
 */
function checkDatabaseConnected() {
    return new Promise((resolve, reject)=>{
        let interval = setInterval(()=>{
            if (!isDbConnected) return;
            clearInterval(interval);
            return resolve();
        }, 1000);
    });
}



module.exports = {
    eAuditMongoUrl,
    databaseConns,
    checkDatabaseConnected
};
