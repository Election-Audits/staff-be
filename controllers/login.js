'use strict';

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
import { staffCookieMaxAge } from "../utils/misc"; // init i18next
import { signupSchema, signupConfirmSchema, loginSchema, loginConfirmSchema } from "../utils/joi";
// import { getJoiError } from "shared-lib/backend/misc";


// ES Module import
let randomString;
import('crypto-random-string').then((importRet)=>{
    randomString = importRet.default;
});


// time limit to confirm code for 2FA 
const verifyWindow = 30*60*1000; // ms. (30 minutes) 30*60*1000

const cookieOptions = {
    httpOnly: true, signed: true, maxAge: staffCookieMaxAge
};


let transporter = nodemailer.createTransport({});
let emailUser;
let emailPassword;

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


/**
 * Signup controller
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
async function signup (req, res, next) {
    debug('received request to /signup...');
    let body = Object.assign({}, req.body);
    // validate inputs with joi
    let { error } = await signupSchema.validateAsync(body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")}); // todo printf
    }
    let email = body.email; debug('email: ', email);
    // First try to get record from db to check pre-approval
    let record = await staffModel.findOne({email}, {password: 0});
    debug('record: ', record);
    if (!record) return Promise.reject({errMsg: i18next.t("not_approved_signup")}); // , {lng}
    // if email already confirmed, user has already signed up
    if (record.emailConfirmed) return Promise.reject({errMsg: i18next.t("account_exists")});
    // Update record with body fields, then send confirmation email
    delete body.email; // not updating email
    body.password = await bcrypt.hash(body.password, 12); // hash password
    // create a code to be sent by email
    let code = randomString({length: 12});
    let emailCodes_0 = record.emailCodes || [];
    let emailCodes = [...emailCodes_0, {code, createdAtms: Date.now()}];
    // remove emailCodes that are too old
    emailCodes = emailCodes.filter((x)=>{
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
        text: i18next.t("otp_message") + code, // plain text body
        // html: "<b>OTP for signup</b>", // html body
    });
    // debug('email sent. info ret: ', info);
    // {accepted: ['<email>'], rejected: [], response: '',...}
    if (info.rejected.length > 0) { // email error
        debug('email error');
        return Promise.reject(info);
    }
}


/**
 * Signup confirm. Use the code sent by email to complete signup
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
async function signupConfirm(req, res, next) {
    debug('received request to /signup/confirm...');
    let body = req.body;
    let email = body.email; 
    debug('body: ', body);
    // validate inputs with joi
    let { error } = await signupConfirmSchema.validateAsync(body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")}); // todo printf
    }
    // first get record from db
    let record = await staffModel.findOne({email});
    debug('record: ', record);
    // check if account already exists
    if (record?.emailConfirmed) return Promise.reject({errMsg: i18next.t("account_exists")});
    // search emailCodes array for a code that matches
    let dbCodes = record?.emailCodes || []; // {code: 0}
    let ind = dbCodes.findIndex((codeObj)=> codeObj.code == body.code);
    if (ind == -1) return Promise.reject({errMsg: i18next.t("wrong_code")});
    // Ensure that the code has not expired
    let codeCreatedAt = record?.emailCodes[ind].createdAtms || 0; // dbCodes
    let deltaT = Date.now() - codeCreatedAt;
    if (deltaT > verifyWindow) {
        debug(`code has expired: deltaT is ${deltaT/1000} seconds`);
        return Promise.reject({errMsg: i18next.t("expired_code")});
    }
    // At this point, code is equal, and within verification window. Update record
    let update = {$set: {emailConfirmed: true}, $unset: {emailCodes: 1}};
    await staffModel.updateOne({email}, update);
    // set cookie for authenticating future requests
    req.session.email = email;
}


/**
 * 
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
async function login(req, res, next) {
    let body = req.body;
    let email = body.email; debug('email: ', email);
    // validate inputs with joi
    let { error } = await loginSchema.validateAsync(body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")}); // todo printf
    }
    let record = await staffModel.findOne({email});
    debug('record: ', JSON.stringify(record));
    // Ensure user account exists
    if (!record || !record.emailConfirmed) {
        return Promise.reject({errMsg: i18next.t("account_not_exist")});
    }
    // check if password is equal
    let pwdEqual = await bcrypt.compare(''+body.password, record.password+'');
    if (!pwdEqual) return Promise.reject({errMsg: i18next.t("wrong_email_password")});
    // Account exists and password correct. Create OTP to be sent by email
    let code = randomString({length: 8});
    let emailCodes_0 = record.emailCodes || [];
    let emailCodes = [...emailCodes_0, {code, createdAtms: Date.now()}];
    // remove emailCodes that are too old
    emailCodes = emailCodes.filter((x)=>{
        let codeAge = Date.now() - (x.createdAtms || 0);
        return codeAge < 2*verifyWindow;
    });
    body.emailCodes = emailCodes;
    let update = {$set: {emailCodes}};
    await staffModel.updateOne({email}, update);
    debug(`code: ${code}`);
    if (BUILD == BUILD_TYPES.local) return;
    // send email if running on cloud
    debug('running on cloud, will send email');
    const info = await transporter.sendMail({
        from: emailUser, // sender address
        to: email, // list of receivers
        subject: "OTP", // Subject line
        text: i18next.t("otp_message") + code, // plain text body
        // html: "<b>OTP for signup</b>", // html body
    });
    // debug('email sent. info ret: ', info); 
    // {accepted: ['<email>'], rejected: [], response: '',...}
    if (info.rejected.length > 0) { // email error
        debug('email error');
        return Promise.reject(info);
    }
}



async function loginConfirm(req, res, next) {
    debug('received request to /login/confirm...'); //debug('body: ', req.body);
    let body = req.body;
    let email = body.email;
    // validate inputs with joi
    let { error } = await loginConfirmSchema.validateAsync(body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")}); // todo printf
    }
    let record = await staffModel.findOne({email});
    // search emailCodes array for a code that matches
    let dbCodes = record?.emailCodes || [];
    let ind = dbCodes.findIndex((codeObj)=> codeObj.code == body.code);
    if (ind == -1) return Promise.reject({errMsg: i18next.t("wrong_code")});
    //assertNumber(ind);
    let codeCreatedAt = record?.emailCodes[ind].createdAtms; // ind
    let deltaT = Date.now() - (codeCreatedAt || 0);
    if (deltaT > verifyWindow) {
        debug(`code has expired: deltaT is ${deltaT/1000} seconds`);
        return Promise.reject({errMsg: i18next.t("expired_code")});
    }
    // set cookie for authenticating future requests
    req.session.email = email;
}


module.exports = {
    signup,
    signupConfirm,
    login,
    loginConfirm
};
