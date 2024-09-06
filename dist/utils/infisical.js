"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secrets = void 0;
exports.checkSecretsReturned = checkSecretsReturned;
const debug = require('debug')('ea:infisical');
debug.log = console.log.bind(console);
const env_1 = require("../utils/env");
const constants_1 = require("shared-lib/constants");
const sdk_1 = require("@infisical/sdk");
const infisClient = (env_1.BUILD == constants_1.BUILD_TYPES.cloud) ? new sdk_1.InfisicalClient({
    clientId: env_1.INFISICAL_ID,
    clientSecret: env_1.INFISICAL_SECRET
}) : null;
exports.secrets = {}; // store secrets to object keyed by secretKey values
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        // get secrets from Infisical
        let secretsList; // | undefined;
        if (env_1.BUILD == constants_1.BUILD_TYPES.cloud) {
            secretsList = (yield (infisClient === null || infisClient === void 0 ? void 0 : infisClient.listSecrets({
                projectId: env_1.INFISICAL_PROJECT_ID || '',
                environment: getInfisicalEnvSlug(env_1.NODE_ENV || '')
            }))) || [];
            // debug('list secrets: ', secretsList);
            for (let secretEl of secretsList) {
                exports.secrets[secretEl.secretKey] = secretEl.secretValue;
            }
            debug('secrets: ', exports.secrets);
            secretsReadyBool = true; // indicate that secrets returned
        }
    });
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
    return new Promise((resolve, reject) => {
        // in local build, not using Infisical, resolve trivially
        if (env_1.BUILD == constants_1.BUILD_TYPES.local) {
            debug(`in local build. won't check Infisical secrets, resolving`);
            return resolve();
        }
        // timeout and fail if secrets not returned after a while
        const timeout = 10000; // max time to wait for returned secrets
        let start = Date.now();
        let interval = setInterval(() => {
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
