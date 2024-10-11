// Mongoose Electoral Area model

import * as mongoose from "mongoose";
const debug = require('debug')('ea:elect-area-model');
debug.log = console.log.bind(console);
import { databaseConns, checkDatabaseConnected } from "../mongoose";
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
        if (db == 'eaudit') continue;
        // setup electoralAreaModel
        electoralAreaModel = databaseConns.eaudit.model
        <ElectoralAreaDocument, mongoose.PaginateModel<ElectoralAreaDocument> >
        ("ElectoralArea", electoralAreaSchema, "ElectoralAreas");
    }
}
setup();


const Schema = mongoose.Schema;
const SchemaTypes = mongoose.SchemaTypes;

// ElectoralArea Schema
const electoralAreaSchema = new Schema({
    name: { // e.g Tema Central. full text search, unique
        type: SchemaTypes.String,
        unique: true
    },
    level: {
        type: SchemaTypes.String, // e.g. constituency
        required: true
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
    locationDetails: SchemaTypes.String
});

// create a text index to enable search by text
// electoralAreaSchema.index({name: 'text'}); TODO: use elasticsearch or similar service instead


/////////////////
interface ElectoralAreaData {
    name: string,
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

