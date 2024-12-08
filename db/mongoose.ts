import * as mongoose from "mongoose";
const debug = require('debug')('ea:mongoose');
debug.log = console.log.bind(console);
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD, MONGO_LOCAL_CREDS, DBS } from "../utils/env";
import { secrets, checkSecretsReturned } from "../utils/infisical";


// set connection string depending on whether it's a local or cloud build
const protocol = (BUILD == BUILD_TYPES.local) ? 'mongodb' : 'mongodb+srv';
const mongoUrlBase = (BUILD == BUILD_TYPES.local) ? '127.0.0.1:27017' : '';

export let eAuditMongoUrl = ''; // general 'eaudit' db assign in setup
export let databaseConns: {[key: string]: mongoose.Connection}  = {}; // database connections

export function getAuditMongoUrl() {
    return eAuditMongoUrl;
}


// audit db holds User and session collections. Either eaudit, 'eaudit-test',...
let dbs = DBS?.split(',') || [];
export const auditDbName = dbs.find((db)=> db.startsWith('eaudit'));
debug('auditDbName: ', auditDbName);


// setup functions to run
async function setup () {
    // get secrets from Infisical
    await checkSecretsReturned();
    const mongoUrlBase = (BUILD == BUILD_TYPES.local) ? '127.0.0.1:27017' : secrets.MONGO_URL;
    // mongo credentials
    const mongoCreds = (BUILD == BUILD_TYPES.local) ? MONGO_LOCAL_CREDS : 
    `${secrets.MONGO_USER}:${secrets.MONGO_PASSWORD}@`;
    // set eAuditMongoUrl value for export to utils/session
    eAuditMongoUrl = `${protocol}://${mongoCreds}${mongoUrlBase}/${auditDbName}`;
    // for each database in DBS, establish a connection
    // let mongoOptions: mongoose.ConnectOptions = {};
    let dbs = DBS?.split(',') || [];
    let connectFunctions = [];
    for (let db of dbs) {
        let url = `${protocol}://${mongoCreds}${mongoUrlBase}/${db}?retryWrites=true&w=majority&appName=Cluster0`; //   
        // debug('db to connect: ', db);
        connectFunctions.push(mongoose.createConnection(url));
    }
    let connectRets = await Promise.all(connectFunctions);
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
function getInfisicalEnvSlug(environment: string) {
    let map : { [key: string]: string; } = {
        development: 'dev',
        production: 'prod',
        staging: 'staging'
    };
    return map[environment];
}


let isDbConnected: boolean = false;
/**
 * checks if a database connection has been established
 * @returns a Promise which resolves when database connection is established
 */
export function checkDatabaseConnected() : Promise<void> {
    return new Promise((resolve, reject)=>{
        let interval = setInterval(()=>{
            if (!isDbConnected) return;
            clearInterval(interval);
            return resolve();
        }, 1000);
    });
}
