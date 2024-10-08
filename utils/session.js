'use strict';

const debug = require('debug')('ea:session');
debug.log = console.log.bind(console);
const session = require('express-session');
// const MongoStore = require('connect-mongo');
const MongoDBStore = require('connect-mongodb-session')(session);
const { COOKIE_SECRET: cookieSecretEnv, BUILD } = require('./env');
const { BUILD_TYPES } = require('shared-lib/constants');
const { eAuditMongoUrl } = require('../db/mongoose');
const { auditDbName, staffCookieMaxAge } = require('./misc');
const { secrets, checkSecretsReturned } = require('./infisical');


// create Mongo store
// let store = MongoStore.create({
//     mongoUrl: eAuditMongoUrl
// });

let staffSession = ()=>{};

/*
Obtain cookie secret from Infisical in cloud builds
*/
async function setup() {
    await checkSecretsReturned(); // ensure secrets returned from Infisical
    let cookieSecret = BUILD == BUILD_TYPES.local ? cookieSecretEnv+'' : secrets.COOKIE_SECRET+'';
    // create store with updated eAuditMongoUrl
    // debug('eauditMongoUrl: ', eAuditMongoUrl);
    debug(`eAuditMongoUrl: ${eAuditMongoUrl}, cookieSecret: ${cookieSecret}, cookieMaxAge: ${staffCookieMaxAge}`);
    // const store = MongoStore.create({ // connect-mongo
    //     mongoUrl: eAuditMongoUrl,
    //     // dbName: auditDbName // NB: dbName set in connection string
    //     stringify: false
    // });

    const store = new MongoDBStore({
        uri: eAuditMongoUrl
        
    });

    store.on('error', (error)=>{
        debug('Mongodb store error: ', error);
    });

    // session
    staffSession = session({
        name: 'staff',
        secret: cookieSecret,
        cookie: {
            maxAge: staffCookieMaxAge
        },
        store,
        resave: false, // don't resave session unless modified.
        saveUninitialized: false // don't save empty sessions.
    });
}

setup();



module.exports = {
    getStaffSession: ()=> staffSession
};
