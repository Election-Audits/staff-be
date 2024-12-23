// Mongoose Electoral Area model

import * as mongoose from "mongoose";
const debug = require('debug')('ea:elect-area-model');
debug.log = console.log.bind(console);
import { databaseConns, checkDatabaseConnected, auditDbName } from "../mongoose";
import { DBS } from "../../utils/env"
import paginate from "mongoose-paginate-v2";


/*
check db connection, then create model using db connection
*/
async function setup() {
    await checkDatabaseConnected();
    let dbs = DBS?.split(",") || [];
    // create models for each database (by country/entity)
    for (let db of dbs) {
        if (db == auditDbName) continue;
        // setup electoralAreaModel
        electoralAreaModel = databaseConns[db].model
        <ElectoralAreaDocument, mongoose.PaginateModel<ElectoralAreaDocument> >
        ("ElectoralArea", electoralAreaSchema, "ElectoralAreas");
    }
}
setup();


const Schema = mongoose.Schema;
const SchemaTypes = mongoose.SchemaTypes;

// ElectoralArea Schema
const electoralAreaSchema = new Schema({
    name: SchemaTypes.String, // e.g Tema Central
    nameLowerCase: { 
        type: SchemaTypes.String
    },
    level: {
        type: SchemaTypes.String, // e.g. constituency
        required: true,
        index: true
    },
    parentLevelId: {
        type: SchemaTypes.String, // id of Greater Accra region
    },
    parentLevelName: {
        type: SchemaTypes.String, // e.g. Greater Accra
    },
    location: {
        lon: SchemaTypes.Number,
        lat: SchemaTypes.Number
    },
    locationDetails: SchemaTypes.String,
    code: SchemaTypes.String // optional, unique code possibly provided by electoral commission
});

// create a text index to enable search by text
// electoralAreaSchema.index({nameLowerCase: 'text'}); TODO: use elasticsearch or similar service instead
electoralAreaSchema.index({code: 1, nameLowerCase: 1}, {unique: true}); // if code is null, require uniqueness on name

/////////////////
interface ElectoralAreaData {
    name: string,
    nameLowerCase: string,
    level: string,
    parentLevelId: string,
    parentLevelName: string,
    location: {
        lon: number,
        lat: number
    },
    locationDetails: string
};

// declare a mongoose document based on a Typescript interface representing your schema
interface ElectoralAreaDocument extends mongoose.Document, ElectoralAreaData {};
//////////////////

electoralAreaSchema.plugin(paginate);

// init electoralAreaModel to set right type. Will be updated upon db connections in setup
export let electoralAreaModel = mongoose.model<ElectoralAreaDocument, mongoose.PaginateModel<ElectoralAreaDocument> >
("ElectoralArea", electoralAreaSchema, "ElectoralAreas");

