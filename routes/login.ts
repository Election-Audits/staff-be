const debug = require('debug')('ea:api-login');
debug.log = console.log.bind(console);
import * as express from "express";
import { endpointError } from "shared-lib/backend/misc";
import * as nodemailer from "nodemailer";
import { secrets ,checkSecretsReturned } from "../utils/infisical";
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD, EMAIL_USER as emailUserEnv, EMAIL_PASSWORD as emailPasswordEnv } from "../utils/env";
import multer from "multer";
import { signup } from "../controllers/login";





const router = express.Router();

export default router;

router.use(express.json());



// max age of auth cookie
const cookieMaxAge = 5*24*3600*1000; // max age in milliseconds (5 days)

const cookieOptions = {
    httpOnly: true, signed: true, maxAge: cookieMaxAge
};




/*
Signup. For signup, an admin needs to create a record consisting of just email
in the database. This serves as a preapproval to allow only certain people to signup
*/
router.post('/signup',
// TODO: input check
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


