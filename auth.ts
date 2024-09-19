const debug = require('debug')('ea:auth');
debug.log = console.log.bind(console);

import passport from "passport";
import { Strategy as CookieStrategy } from "passport-cookie";
import { staffModel } from "./db/models";
import * as express from "express";
import i18next from "i18next";


// Auth with staff cookie. TODO: roles, scope (country), time
passport.use('staff-cookie',
new CookieStrategy({
    cookieName: 'staff',
    passReqToCallback: true,
    signed: true
},
async (req: express.Request, token: string | undefined, cb: Function)=>{
    try {
        debug('cb. signedCookies: ', req.signedCookies);
        let email = req.signedCookies.staff; // email
        let staff = await staffModel.findOne({email}, {password: 0});
        if (!staff) return cb(null, false, {errMsg: i18next.t("account_not_exist")});
        // ensure signup has been completed, i.e emailConfirmed field set
        if (!staff.emailConfirmed) return cb(null, false, {errMsg: i18next.t("account_not_exist")});
        //
        return cb(null, staff);
    } catch (exc) {
        debug('staff cookie auth exc: ', exc);
        return cb(null, false, exc);
    }
})
);


// Data Entry role
