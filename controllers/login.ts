import * as express from "express";
const debug = require('debug')("ea:ctrl-login");
debug.log = console.log.bind(console);
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD, EMAIL_USER as emailUserEnv, EMAIL_PASSWORD as emailPasswordEnv } from "../utils/env";
import nodemailer from "nodemailer";
import { staffModel } from "../db/models";
import i18next from "i18next";
import * as bcrypt from "bcrypt";
import { secrets ,checkSecretsReturned } from "../utils/infisical";
import "../utils/misc"; // init i18next


// ES Module import
let randomString : Function;
import('crypto-random-string').then((importRet)=>{
    randomString = importRet.default;
});


// time limit to confirm code for 2FA 
const verifyWindow = 30*60*1000; // ms. (30 minutes) 30*60*1000


let transporter = nodemailer.createTransport({});
let emailUser : string;
let emailPassword: string;

async function setup() {
    await checkSecretsReturned();
    // TODO: get EMAIL_USER and EMAIL_PASSWORD from Infisical
    // get emailUser from environment in local build, Infisical in cloud build
    emailUser = (BUILD == BUILD_TYPES.local) ? emailUserEnv+'' : ''; // TODO: get from Infisical
    emailPassword = (BUILD == BUILD_TYPES.local) ? emailPasswordEnv+'' : ''; // TODO
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


export async function signup (req: express.Request, res: express.Response, next: express.NextFunction) {
    debug('received request to /signup...');
    let body = Object.assign({}, req.body);
    let email = body.email; debug('email: ', email);
    // First try to get record from db to check pre-approval
    let record = await staffModel.findOne({email}, {password: 0});
    debug('record: ', record);
    let errMsg = i18next.t("not_approved_signup"); debug('translated message: ', errMsg);
    if (!record) return Promise.reject({errMsg: i18next.t("not_approved_signup")});
    // if email already confirmed, user has already signed up
    if (record.emailConfirmed) return Promise.reject({errMsg: i18next});
    // Update record with body fields, then send confirmation email
    delete body.email; // not updating email
    body.password = await bcrypt.hash(body.password, 12); // hash password
    // create a code to be sent by email
    let code = randomString({length: 8});
    let emailCodes_0 = record.emailCodes || [];
    let emailCodes: any = [...emailCodes_0, {code, createdAtms: Date.now()}];
    // filter out emailCodes that are too old
    emailCodes = emailCodes.filter((x: any)=>{
        let codeAge = Date.now() - x.createdAtms;
        return codeAge < 2*verifyWindow;
    });
    body.emailCodes = emailCodes;
    await staffModel.updateOne({email}, {$set: body});
    debug(`code: ${code}`);
    if (BUILD == BUILD_TYPES.local) return;
    // send email if running on cloud
    debug('running on cloud, will send email');
    const info = await transporter.sendMail({
        from: emailUser, // sender address
        to: email, // list of receivers
        subject: "OTP", // Subject line
        text: `Hello, use the following code to complete signup: ${code}`, // plain text body
        // html: "<b>OTP for signup</b>", // html body
    });
    // debug('email sent. info ret: ', info);
    // {accepted: ['<email>'], rejected: [], response: '',...}
    if (info.rejected.length > 0) { // email error
        debug('email error');
        return Promise.reject(info);
    }
}
