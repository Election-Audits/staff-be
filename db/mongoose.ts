import * as mongoose from "mongoose";
const debug = require('debug')('ea:mongoose');
debug.log = console.log.bind(console);
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD, INFISICAL_ID, INFISICAL_SECRET, INFISICAL_PROJECT_ID, NODE_ENV } from "../utils/env";
import { InfisicalClient, LogLevel } from "@infisical/sdk";


// set connection string depending on whether it's a local or cloud build
const protocol = (BUILD == BUILD_TYPES.local) ? 'mongodb' : 'mongodb+srv';
const mongoUrlBase = (BUILD == BUILD_TYPES.local) ? '127.0.0.1:27017' : ''; // TODO: set cloud urls
let mongoCreds : string; // mongodb credentials


const infisClient = (BUILD == BUILD_TYPES.cloud) ? new InfisicalClient({
    clientId: INFISICAL_ID,
    clientSecret: INFISICAL_SECRET
}) : null;

// setup functions to run
async function setup () {
    // get secrets from Infisical
    // let res = infisClient?.listSecrets({
    //     projectId: INFISICAL_PROJECT_ID || '',
    //     environment: NODE_ENV || ''
    // });
    let secretFuncs = [];
    // get secrets that are only relevant on cloud builds
    if (BUILD == BUILD_TYPES.cloud) {
        secretFuncs.push(infisClient?.getSecret({
            projectId: INFISICAL_PROJECT_ID || '',
            environment: getInfisicalEnvSlug(NODE_ENV || ''), // TODO dev
            secretName: 'MONGO_USER'
        }));
        secretFuncs.push(infisClient?.getSecret({
            projectId: INFISICAL_PROJECT_ID || '',
            environment: getInfisicalEnvSlug(NODE_ENV || ''),
            secretName: 'MONGO_PASSWORD'
        }));
    }
    
    let secrets = await Promise.all(secretFuncs);
    debug('secrets: ', secrets);
}

setup();


// function capitalizeFirstLetter(str: string) : string {
//     let strOut = str.substring(0,1).toUpperCase() + str.substring(1);
//     debug('strOut: ', strOut);
//     return strOut;
// }


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
