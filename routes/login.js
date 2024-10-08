'use strict';

const debug = require('debug')('ea:rte-login');
debug.log = console.log.bind(console);
const express = require('express');
const { endpointError } = require('shared-lib/backend/misc');
const nodemailer = require('nodemailer');
const { secrets , checkSecretsReturned } = require('../utils/infisical');
const { BUILD_TYPES } = require('shared-lib/constants');
const { BUILD, EMAIL_USER: emailUserEnv, EMAIL_PASSWORD: emailPasswordEnv, COOKIE_SECRET: cookieSecretEnv } 
= require('../utils/env');
const multer = require('multer');
const { signup, signupConfirm, login, loginConfirm } = require('../controllers/login');
const passport = require('passport');
const i18next = require('i18next');
const cookieParser = require('cookie-parser');
const { getStaffSession } = require('../utils/session');



const router = express.Router();

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
    getStaffSession()(req,res,next);
},
(req,res,next)=>{
    signupConfirm(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=>{
        endpointError(err, req, res);
    });
});


// TODO: /code

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
    getStaffSession()(req,res,next);
},
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
(req,res,next)=>{
    getStaffSession()(req,res,next);
},
(req,res,next)=>{
    debug('received request to /logout...');
    debug('cookie: ', req.cookies); debug('signed cookie: ', req.signedCookies);
    passport.authenticate('staff-cookie', (err, user, failInfo)=>{
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


// TODO: /password/reset and ~/confirm


module.exports = router;
