'use strict';

const debug = require('debug')('ea:infisical');
debug.log = console.log.bind(console);
import { INFISICAL_ID, INFISICAL_SECRET, INFISICAL_PROJECT_ID, BUILD, NODE_ENV } from "../utils/env";
import { BUILD_TYPES } from "shared-lib/constants";
import { InfisicalClient, LogLevel, SecretElement } from "@infisical/sdk";



const infisClient = (BUILD == BUILD_TYPES.cloud) ? new InfisicalClient({
    clientId: INFISICAL_ID,
    clientSecret: INFISICAL_SECRET
}) : null;


let secrets = {}; // store secrets to object keyed by secretKey values

async function setup() {
    // get secrets from Infisical
    let secretsList;// | undefined;
    if (BUILD == BUILD_TYPES.cloud) {
        secretsList = await infisClient?.listSecrets({
            projectId: INFISICAL_PROJECT_ID || '',
            environment: getInfisicalEnvSlug(NODE_ENV || '')
        }) || [];
        // debug('list secrets: ', secretsList);
        for (let secretEl of secretsList) {
            secrets[secretEl.secretKey] = secretEl.secretValue;
        }
        debug('secrets: ', secrets);
        secretsReadyBool = true; // indicate that secrets returned
    }
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


let secretsReadyBool = false;
/**
 * checks if a database connection has been established
 * @returns a Promise which resolves when database connection is established
 */
function checkSecretsReturned() {
    return new Promise((resolve, reject)=>{
        // in local build, not using Infisical, resolve trivially
        if (BUILD == BUILD_TYPES.local) {
            debug(`in local build. won't check Infisical secrets, resolving`);
            return resolve();
        }
        // timeout and fail if secrets not returned after a while
        const timeout = 10000; // max time to wait for returned secrets
        let start = Date.now();
        let interval = setInterval(()=>{
            if (!secretsReadyBool) {
                let curTime = Date.now();
                let deltaT = curTime - start;
                if (deltaT > timeout) {
                    clearInterval(interval);
                    reject(`timeout elapsed while awaiting secrets from Infisical`);
                }
                return;
            }
            // secrets ready
            clearInterval(interval);
            return resolve();
        }, 1000); // retry every second until resolved/rejected
    });
}



module.exports = {
    secrets,
    checkSecretsReturned
};
