const debug = require('debug')('ea:api-login');
debug.log = console.log.bind(console);
import * as express from "express";
import { staffModel } from "../db/models";
import { endpointError } from "shared-lib/backend/misc";
import * as nodemailer from "nodemailer";
import { secrets ,checkSecretsReturned } from "../utils/infisical";
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD, EMAIL_USER as emailUserEnv, EMAIL_PASSWORD as emailPasswordEnv } from "../utils/env";


// ES Module import
let randomString : Function;
import('crypto-random-string').then((importRet)=>{
    randomString = importRet.default;
});

const router = express.Router();
router.use(express.json());

// time limit to confirm code for 2FA 
const verifyWindow = 30*60*1000; // ms. (30 minutes) 30*60*1000

// max age of auth cookie
const cookieMaxAge = 5*24*3600*1000; // max age in milliseconds (5 days)

const cookieOptions = {
    httpOnly: true, signed: true, maxAge: cookieMaxAge
};


let transporter: unknown;
// create email transporter
// transporter = nodemailer.createTransport({
//     host: "mail.privateemail.com", //"smtp.ethereal.email",
//     port: 465, //587,
//     secure: true, // Use `true` for port 465, `false` for all other ports
//     auth: {
//         user: emailUser,
//         pass: emailPwd,
//     },
// });


async function setup() {
    await checkSecretsReturned();
    // get emailUser from environment in local build, Infisical in cloud build
    let emailUser = (BUILD == BUILD_TYPES.local) ? emailUserEnv : ''; // TODO: get from Infisical
    let emailPassword = (BUILD == BUILD_TYPES.local) ? emailPasswordEnv : ''; // TODO
    // create email transporter
    transporter = nodemailer.createTransport({
        host: "mail.privateemail.com", //"smtp.ethereal.email",
        port: 465, //587,
        secure: true, // Use `true` for port 465, `false` for all other ports
        auth: {
            user: emailUser,
            pass: emailPassword,
        },
    });
}
setup();
