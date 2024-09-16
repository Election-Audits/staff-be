const debug = require('debug')('ea:rte-login');
debug.log = console.log.bind(console);
import * as express from "express";
import { endpointError } from "shared-lib/backend/misc";
import * as nodemailer from "nodemailer";
import { secrets , checkSecretsReturned } from "../utils/infisical";
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD, EMAIL_USER as emailUserEnv, EMAIL_PASSWORD as emailPasswordEnv, COOKIE_SECRET as cookieSecretEnv } 
from "../utils/env";
import multer from "multer";
import { signup, signupConfirm, login, loginConfirm } from "../controllers/login";
import passport from "passport";
import i18next from "i18next";
import cookieParser from "cookie-parser";
//import { staffSession } from "../utils/session";



const router = express.Router();

export default router;

router.use(express.json());

let cookieSecret = cookieSecretEnv +'';
router.use(cookieParser(cookieSecret)); // cookieSecretEnv TODO: remove?


/*
Obtain secrets (cookie), set up cookie parser
*/
async function setup() {
    await checkSecretsReturned();
    // set cookie secret for cloud build. Will be used by cookieParser
    cookieSecret = (BUILD == BUILD_TYPES.local) ? cookieSecretEnv+'' : secrets.COOKIE_SECRET; // TODO
    // router.use(cookieParser(cookieSecret));
}

setup();


/*
Signup. For signup, an admin needs to create a record consisting of just email
in the database. This serves as a preapproval to allow only certain people to signup
*/
router.post('/signup',
multer().none(),
(req,res,next)=>{
    signup(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=>{
        debug('signup error...');
        endpointError(err, req, res);
    });
});


/*
Signup confirm. enter the one time passcode to prove ownership of email address and
account creation
*/
router.put('/signup/confirm',
(req,res,next)=>{
    signupConfirm(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=>{
        endpointError(err, req, res);
    });
});


/*
*/
router.put('/login',
multer().none(),
(req,res,next)=>{
    login(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=>{
        endpointError(err, req, res);
    });
});



router.put('/login/confirm',
(req,res,next)=>{
    loginConfirm(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=>{
        endpointError(err, req, res);
    });
});


/* Logout */
router.put('/logout',
// staffSession, TODO
(req,res,next)=>{
    debug('received request to /logout...');
    passport.authenticate('staff-cookie', (err: any, user: unknown, failInfo: unknown)=>{
        if (err) {
            debug('err: ', err);
            if (err?.errMsg) return res.status(400).send(err);
            else return res.status(500).send(i18next.t("something_went_wrong"));
        }
        // NB: not checkin user/ failInfo here. clear cookie unconditionally
        res.clearCookie('staff');
        return res.end();
    })(req,res,next);
});
