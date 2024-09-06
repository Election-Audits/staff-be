"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('ea:api-login');
debug.log = console.log.bind(console);
const express = __importStar(require("express"));
const models_1 = require("../db/models");
const misc_1 = require("shared-lib/backend/misc");
const nodemailer = __importStar(require("nodemailer"));
const infisical_1 = require("../utils/infisical");
const constants_1 = require("shared-lib/constants");
const env_1 = require("../utils/env");
const multer_1 = __importDefault(require("multer"));
const bcrypt = __importStar(require("bcrypt"));
const i18next_1 = __importDefault(require("i18next"));
// ES Module import
let randomString;
import('crypto-random-string').then((importRet) => {
    randomString = importRet.default;
});
const router = express.Router();
router.use(express.json());
// time limit to confirm code for 2FA 
const verifyWindow = 30 * 60 * 1000; // ms. (30 minutes) 30*60*1000
// max age of auth cookie
const cookieMaxAge = 5 * 24 * 3600 * 1000; // max age in milliseconds (5 days)
const cookieOptions = {
    httpOnly: true, signed: true, maxAge: cookieMaxAge
};
let transporter = nodemailer.createTransport();
let emailUser;
let emailPassword;
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, infisical_1.checkSecretsReturned)();
        // TODO: get EMAIL_USER and EMAIL_PASSWORD from Infisical
        // get emailUser from environment in local build, Infisical in cloud build
        emailUser = (env_1.BUILD == constants_1.BUILD_TYPES.local) ? env_1.EMAIL_USER + '' : ''; // TODO: get from Infisical
        emailPassword = (env_1.BUILD == constants_1.BUILD_TYPES.local) ? env_1.EMAIL_PASSWORD + '' : ''; // TODO
        // create email transporter
        let transporter = nodemailer.createTransport({
            host: "mail.privateemail.com", //"smtp.ethereal.email",
            port: 465, //587,
            secure: true, // Use `true` for port 465, `false` for all other ports
            auth: {
                user: emailUser,
                pass: emailPassword,
            },
        });
    });
}
setup();
// initialize i18next
i18next_1.default.init({
    lng: 'en', // define only when not using language detector
    debug: true,
    resources: {}
});
/*
Signup. For signup, an admin needs to create a record consisting of just email
in the database. This serves as a preapproval to allow only certain people to signup
*/
router.post('/signup', (0, multer_1.default)().none(), (req, res, next) => {
    signup(req, res, next)
        .then(() => {
        return res.status(200).end();
    })
        .catch((err) => {
        debug('signup error...');
        (0, misc_1.endpointError)(err, req, res);
    });
});
function signup(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        debug('received request to /signup...');
        let body = Object.assign({}, req.body);
        let email = body.email;
        debug('email: ', email);
        // First try to get record from db to check pre-approval
        let record = yield models_1.staffModel.findOne({ email }, { password: 0 });
        debug('record: ', record);
        if (!record)
            return Promise.reject({ errMsg: "Sorry, you're not approved for signup. Contact admin" });
        // if email already confirmed, user has already signed up
        if (record.emailConfirmed)
            return Promise.reject({ errMsg: "Account already exists, please login" });
        // Update record with body fields, then send confirmation email
        delete body.email; // not updating email
        body.password = yield bcrypt.hash(body.password, 12); // hash password
        // create a code to be sent by email
        let code = randomString({ length: 8 });
        let emailCodes_0 = record.emailCodes || [];
        let emailCodes = [...emailCodes_0, { code, createdAtms: Date.now() }];
        // filter out emailCodes that are too old
        emailCodes = emailCodes.filter((x) => {
            let codeAge = Date.now() - x.createdAtms;
            return codeAge < 2 * verifyWindow;
        });
        body.emailCodes = emailCodes;
        yield models_1.staffModel.updateOne({ email }, { $set: body });
        debug(`code: ${code}`);
        if (env_1.BUILD == constants_1.BUILD_TYPES.local)
            return;
        // send email if running on cloud
        debug('running on cloud, will send email');
        const info = yield transporter.sendMail({
            from: emailUser, //'"Maddison Foo Koch 👻" <maddison53@ethereal.email>', // sender address
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
    });
}
