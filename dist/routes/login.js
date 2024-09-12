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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('ea:api-login');
debug.log = console.log.bind(console);
const express = __importStar(require("express"));
const misc_1 = require("shared-lib/backend/misc");
const multer_1 = __importDefault(require("multer"));
const login_1 = require("../controllers/login");
const router = express.Router();
exports.default = router;
router.use(express.json());
/*
Signup. For signup, an admin needs to create a record consisting of just email
in the database. This serves as a preapproval to allow only certain people to signup
*/
router.post('/signup', (0, multer_1.default)().none(), (req, res, next) => {
    (0, login_1.signup)(req, res, next)
        .then(() => {
        return res.status(200).end();
    })
        .catch((err) => {
        debug('signup error...');
        (0, misc_1.endpointError)(err, req, res);
    });
});
/*
Signup confirm. enter the one time passcode to prove ownership of email address and
account creation
*/
router.put('/signup/confirm', (req, res, next) => {
    (0, login_1.signupConfirm)(req, res, next)
        .then(() => {
        return res.status(200).end();
    })
        .catch((err) => {
        (0, misc_1.endpointError)(err, req, res);
    });
});
/*
*/
router.put('/login', (0, multer_1.default)().none(), (req, res, next) => {
    (0, login_1.login)(req, res, next)
        .then(() => {
        return res.status(200).end();
    })
        .catch((err) => {
        (0, misc_1.endpointError)(err, req, res);
    });
});
router.put('/login/confirm', (req, res, next) => {
    (0, login_1.loginConfirm)(req, res, next)
        .then(() => {
        return res.status(200).end();
    })
        .catch((err) => {
        (0, misc_1.endpointError)(err, req, res);
    });
});
