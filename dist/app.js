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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
// NB: can set DOTENV_CONFIG_PATH env, otherwise defaults to ./envs/.env
(_a = process.env).DOTENV_CONFIG_PATH || (_a.DOTENV_CONFIG_PATH = path.join(__dirname, "envs", ".env"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const debug = require('debug')('ea:app');
debug.log = console.log.bind(console);
const login_1 = __importDefault(require("./routes/login"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3010;
app.listen(port, () => {
    debug('starting at: ', new Date());
    console.log(`app is listening on port ${port}`);
});
// a ping to check if app is running
app.get('/ping', (req, res, next) => {
    res.send("App (staff) is running");
});
// mount routers
app.use("/", login_1.default);
