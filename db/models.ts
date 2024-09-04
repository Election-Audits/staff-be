// Mongoose Models

import * as mongoose from "mongoose";
const debug = require('debug')('ea:models');
debug.log = console.log.bind(console);
import { databaseConns, checkDatabaseConnected } from "./mongoose";
import { DBS } from "../utils/env"


async function setup() {
    await checkDatabaseConnected();
    let dbs = DBS?.split(",") || [];
    // create models for each database (by country/entity)
    // let isGeneralDbPresent = false;
    for (let db of dbs) {
        if (db == 'eaudit') continue;
        
    }
    // now setup eaudit database for staff app
    staffModel = databaseConns.eaudit.model("Staff", staffSchema, "Staff")
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




export let staffModel: unknown;



