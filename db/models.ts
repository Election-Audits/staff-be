// Mongoose Models

import * as mongoose from "mongoose";
const debug = require('debug')('ea:models');
debug.log = console.log.bind(console);
import { databaseConns, checkDatabaseConnected } from "./mongoose";
import { DBS } from "../utils/env"
import paginate from "mongoose-paginate-v2";



async function setup() {
    await checkDatabaseConnected();
    let dbs = DBS?.split(",") || [];
    // create models for each database (by country/entity)
    // let isGeneralDbPresent = false;
    for (let db of dbs) {
        if (db == 'eaudit') continue;
        
    }
    // now setup eaudit database for staff app
    staffModel = databaseConns.eaudit.model<StaffDocument, mongoose.PaginateModel<StaffDocument> >
    ("Staff", staffSchema, "Staff")
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
    emailConfirmed: SchemaTypes.Boolean,
    roles: {
        dataEntry: SchemaTypes.Boolean,
        dataApproval: SchemaTypes.Boolean,
        dataMaster: SchemaTypes.Boolean
    },
    scope: new Schema({
        all: SchemaTypes.Boolean // all countries/entities. 
        // scope can also include: [country]: true
        }, 
        { strict: false }
    ),
});


/////////////////
interface StaffData {
    surname: string,
    otherNames: string,
    email: string,
    phone: string,
    password: string,
    emailCodes: [
        { code: string, createdAtms: number }
    ],
    emailConfirmed: boolean,
    roles: {
        dataEntry: boolean,
        dataApproval: boolean,
        dataMaster: boolean
    },
    scope: {}
}

// declare a mongoose document based on a Typescript interface representing your schema
//interface InstitutionDocument extends mongoose.Document, InstitutionData {}
interface StaffDocument extends mongoose.Document, StaffData {}


////////////////

staffSchema.plugin(paginate); // use paginate plugin
// init staffModel to set right type. Will be updated upon db connections in setup
export let staffModel = mongoose.model<StaffDocument, mongoose.PaginateModel<StaffDocument> >
("Staff", staffSchema, "Staff");



