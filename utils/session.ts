const debug = require('debug')('ea:session');
debug.log = console.log.bind(console);
import session from "express-session";
import MongoStore from "connect-mongo";
import { COOKIE_SECRET as cookieSecretEnv, BUILD } from "./env";
import { BUILD_TYPES } from "shared-lib/constants";
import { checkDatabaseConnected, getAuditMongoUrl } from "../db/mongoose";
import { staffCookieMaxAge } from "./misc";
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
    // create store with updated eAuditMongoUrl
    // debug(`eAuditMongoUrl: ${eAuditMongoUrl}, cookieMaxAge: ${staffCookieMaxAge}`);
    let cookieSecret = cookieSecretEnv+''; // debug('cookie secret: ', cookieSecret);
    await checkDatabaseConnected(); // ensure eaudit mongourl set (done after db connection)
    let mongoUrl = getAuditMongoUrl(); // debug('mongoUrl: ', mongoUrl);
    const store = MongoStore.create({
        mongoUrl: mongoUrl,
        // dbName: auditDbName // NB: dbName set in connection string
        stringify: false,
        collectionName: 'sessionsStaff'
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
