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
const debug = require('debug')('ea:mongoose');
debug.log = console.log.bind(console);
const constants_1 = require("shared-lib/constants");
const env_1 = require("../utils/env");
const sdk_1 = require("@infisical/sdk");
// set connection string depending on whether it's a local or cloud build
const protocol = (env_1.BUILD == constants_1.BUILD_TYPES.local) ? 'mongodb' : 'mongodb+srv';
const mongoUrlBase = (env_1.BUILD == constants_1.BUILD_TYPES.local) ? '127.0.0.1:27017' : ''; // TODO: set cloud urls
let mongoCreds; // mongodb credentials
const infisClient = (env_1.BUILD == constants_1.BUILD_TYPES.cloud) ? new sdk_1.InfisicalClient({
    clientId: env_1.INFISICAL_ID,
    clientSecret: env_1.INFISICAL_SECRET
}) : null;
// setup functions to run
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        // get secrets from Infisical
        // let res = infisClient?.listSecrets({
        //     projectId: INFISICAL_PROJECT_ID || '',
        //     environment: NODE_ENV || ''
        // });
        let secretFuncs = [];
        // get secrets that are only relevant on cloud builds
        if (env_1.BUILD == constants_1.BUILD_TYPES.cloud) {
            secretFuncs.push(infisClient === null || infisClient === void 0 ? void 0 : infisClient.getSecret({
                projectId: env_1.INFISICAL_PROJECT_ID || '',
                environment: getInfisicalEnvSlug(env_1.NODE_ENV || ''), // TODO dev
                secretName: 'MONGO_USER'
            }));
            secretFuncs.push(infisClient === null || infisClient === void 0 ? void 0 : infisClient.getSecret({
                projectId: env_1.INFISICAL_PROJECT_ID || '',
                environment: getInfisicalEnvSlug(env_1.NODE_ENV || ''),
                secretName: 'MONGO_PASSWORD'
            }));
        }
        let secrets = yield Promise.all(secretFuncs);
        debug('secrets: ', secrets);
    });
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
function getInfisicalEnvSlug(environment) {
    let map = {
        development: 'dev',
        production: 'prod',
        staging: 'staging'
    };
    return map[environment];
}
