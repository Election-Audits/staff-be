const debug = require('debug')('ea:api-login');
debug.log = console.log.bind(console);
import * as express from "express";
import { endpointError } from "shared-lib/backend/misc";
import * as nodemailer from "nodemailer";
import { secrets ,checkSecretsReturned } from "../utils/infisical";
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD, EMAIL_USER as emailUserEnv, EMAIL_PASSWORD as emailPasswordEnv } from "../utils/env";
import multer from "multer";
import { signup, signupConfirm, login, loginConfirm } from "../controllers/login";





const router = express.Router();

export default router;

router.use(express.json());





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

