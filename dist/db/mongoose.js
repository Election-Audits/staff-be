"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.databaseConns = void 0;
exports.checkDatabaseConnected = checkDatabaseConnected;
const mongoose = __importStar(require("mongoose"));
const debug = require('debug')('ea:mongoose');
debug.log = console.log.bind(console);
const constants_1 = require("shared-lib/constants");
const env_1 = require("../utils/env");
const sdk_1 = require("@infisical/sdk");
// set connection string depending on whether it's a local or cloud build
const protocol = (env_1.BUILD == constants_1.BUILD_TYPES.local) ? 'mongodb' : 'mongodb+srv';
const mongoUrlBase = (env_1.BUILD == constants_1.BUILD_TYPES.local) ? '127.0.0.1:27017' : ''; // TODO: set cloud urls
exports.databaseConns = {}; // database connections
const infisClient = (env_1.BUILD == constants_1.BUILD_TYPES.cloud) ? new sdk_1.InfisicalClient({
    clientId: env_1.INFISICAL_ID,
    clientSecret: env_1.INFISICAL_SECRET
}) : null;
// setup functions to run
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        // get secrets from Infisical
        let secretsList; // | undefined;
        let secrets = {}; // store secrets to object keyed by secretKey values
        if (env_1.BUILD == constants_1.BUILD_TYPES.cloud) {
            secretsList = (yield (infisClient === null || infisClient === void 0 ? void 0 : infisClient.listSecrets({
                projectId: env_1.INFISICAL_PROJECT_ID || '',
                environment: getInfisicalEnvSlug(env_1.NODE_ENV || '')
            }))) || [];
            // debug('list secrets: ', secretsList);
            for (let secretEl of secretsList) {
                secrets[secretEl.secretKey] = secretEl.secretValue;
            }
            // debug('secrets: ', secrets);
        }
        const mongoCreds = (env_1.BUILD == constants_1.BUILD_TYPES.local) ? env_1.MONGO_LOCAL_CREDS :
            `${secrets.MONGO_USER}:${secrets.MONGO_PASSWORD}@`;
        //const mongoUrl = `${protocol}://${mongoCreds}${mongoUrlBase}`;
        //await mongoose.connect(mongoUrl);
        //let mongoClient = mongoose.connection.db;
        // for each database in DBS, establish a connection
        let mongoOptions = {};
        let dbs = (env_1.DBS === null || env_1.DBS === void 0 ? void 0 : env_1.DBS.split(',')) || [];
        let connectFunctions = [];
        for (let db of dbs) {
            let url = `${protocol}://${mongoCreds}${mongoUrlBase}/${db}`;
            debug('mongo url: ', url);
            connectFunctions.push(mongoose.createConnection(url));
        }
        let connectRets = yield Promise.all(connectFunctions);
        //debug('connectRets: ', connectRets);
        // save in database connections object
        for (let ind = 0; ind < dbs.length; ind++) {
            exports.databaseConns[dbs[ind]] = connectRets[ind];
        }
        isDbConnected = true; // indicate succesful db connection
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
let isDbConnected = false;
/**
 * checks if a database connection has been established
 * @returns a Promise which resolves when database connection is established
 */
function checkDatabaseConnected() {
    return new Promise((resolve, reject) => {
        let interval = setInterval(() => {
            if (!isDbConnected)
                return;
            clearInterval(interval);
            return resolve();
        }, 1000);
    });
}
