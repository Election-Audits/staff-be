const debug = require('debug')('ea:auth');
debug.log = console.log.bind(console);

import passport from "passport";
import { Strategy as CookieStrategy } from "passport-cookie";
import { staffModel } from "./db/models/staff";
import * as express from "express";
import i18next from "i18next";


// Auth with staff cookie. TODO: time bound?
passport.use('staff-cookie',
new CookieStrategy({
    cookieName: 'staff',
    passReqToCallback: true,
    signed: true
},
async (req: express.Request, token: string | undefined, cb: Function)=>{
    try {
        debug('cb. session. email: ', req.session.email);
        let email = req.session.email; // email
        // ensure email defined
        if (!email) {
            debug('unauthorized. no cookie or email/phone');
            return cb(null, false, 'unauthorized. no cookie or email/phone');
        }

        let staff = await staffModel.findOne({email}, {password: 0});
        if (!staff) {
            debug(`staff account doesn't exist for ${email}`);
            return cb(null, false, {errMsg: i18next.t("account_not_exist")});
        }

        // ensure signup has been completed, i.e emailConfirmed field set
        if (!staff.emailConfirmed) {
            debug(`staff email not confirmed for: ${email}`);
            return cb(null, false, {errMsg: i18next.t("account_not_exist")});
        }

        //
        return cb(null, staff);
    } catch (exc) {
        debug('staff cookie auth exc: ', exc);
        return cb(null, false, exc);
    }
})
);


// TODO: Data Entry role, data approval




// Data Master
passport.use('data-master-cookie',
new CookieStrategy({
    cookieName: 'staff',
    passReqToCallback: true,
    signed: true
    },
    async (req: express.Request, token: string | undefined, cb: Function)=>{
        try {
            debug('cb for data-master. email: ', req.session.email); // debug('session: ', req.session);
            let email = req.session.email; // email
            // ensure email defined
            if (!email) {
                debug('unauthorized. no cookie or email/phone');
                return cb(null, false, 'unauthorized. no cookie or email/phone');
            }

            let staff = await staffModel.findOne({email}, {password: 0});
            if (!staff) {
                debug('staff falsy. Will callback with failure message');
                return cb(null, false, {errMsg: i18next.t("account_not_exist") });
            }

            // ensure signup has been completed, i.e emailConfirmed field set
            if (!staff.emailConfirmed) {
                debug(`staff email not confirmed for: ${email}`);
                return cb(null, false, {errMsg: i18next.t("account_not_exist")});
            }

            // Ensure the admin has the correct data master role to perform action
            if (!staff.roles?.dataMaster) {
                debug(`staff doesn't have the data master role: ${email}`);
                return cb(null, false, {errMsg: i18next.t("no_role_permission")});
            }

            // Ensure the admin has the right scope permission (TODO in different middleware)
            return cb(null, staff);
        } catch (exc) {
            debug('staff cookie auth exc: ', exc);
            return cb(null, false, exc);
        }
    }
));
