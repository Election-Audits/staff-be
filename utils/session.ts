const debug = require('debug')('ea:session');
debug.log = console.log.bind(console);
import session from "express-session";
import MongoStore from "connect-mongo";
import { COOKIE_SECRET as cookieSecretEnv, BUILD } from "./env";
import { BUILD_TYPES } from "shared-lib/constants";
import { eAuditMongoUrl } from "../db/mongoose";
import { auditDbName, staffCookieMaxAge } from "./misc";
import { secrets, checkSecretsReturned } from "./infisical";


// create Mongo store
// let store = MongoStore.create({
//     mongoUrl: eAuditMongoUrl
// });

declare module 'express-session' {
    interface SessionData {
        email: string
    }
}

// initialize session to set type
export let staffSession = session({
    secret: cookieSecretEnv+''
});

/*
Obtain cookie secret from Infisical in cloud builds
*/
async function setup() {
    await checkSecretsReturned(); // ensure secrets returned from Infisical
    let cookieSecret = BUILD == BUILD_TYPES.local ? cookieSecretEnv+'' : secrets.COOKIE_SECRET+'';
    // create store with updated eAuditMongoUrl
    // debug('eauditMongoUrl: ', eAuditMongoUrl);
    debug(`eAuditMongoUrl: ${eAuditMongoUrl}, cookieSecret: ${cookieSecret}, cookieMaxAge: ${staffCookieMaxAge}`);
    const store = MongoStore.create({
        mongoUrl: eAuditMongoUrl,
        // dbName: auditDbName // NB: dbName set in connection string
        stringify: false
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
