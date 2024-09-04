"use strict";
// Mongoose Models
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffModel = void 0;
const mongoose = __importStar(require("mongoose"));
const debug = require('debug')('ea:models');
debug.log = console.log.bind(console);
const mongoose_1 = require("./mongoose");
const env_1 = require("../utils/env");
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, mongoose_1.checkDatabaseConnected)();
        let dbs = (env_1.DBS === null || env_1.DBS === void 0 ? void 0 : env_1.DBS.split(",")) || [];
        // create models for each database (by country/entity)
        // let isGeneralDbPresent = false;
        for (let db of dbs) {
            if (db == 'eaudit')
                continue;
        }
        // now setup eaudit database for staff app
        exports.staffModel = mongoose_1.databaseConns.eaudit.model("Staff", staffSchema, "Staff");
    });
}
setup();
const Schema = mongoose.Schema;
const SchemaTypes = mongoose.SchemaTypes;
// Staff Schema
const staffSchema = new Schema({
    surname: SchemaTypes.String,
    otherNames: SchemaTypes.String,
    email: {
        type: SchemaTypes.String,
        unique: true
    },
    phone: SchemaTypes.String,
    password: SchemaTypes.String,
    emailCodes: [
        { code: SchemaTypes.String, createdAtms: SchemaTypes.Number }
    ],
    emailConfirmed: SchemaTypes.Boolean
});
