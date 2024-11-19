// Mongoose models for collections with simple setup (no interface/pagination)

import * as mongoose from "mongoose";
const debug = require('debug')('ea:other-models');
debug.log = console.log.bind(console);
import { databaseConns, checkDatabaseConnected, auditDbName } from "../mongoose";
import { DBS } from "../../utils/env"


async function setup() {
    await checkDatabaseConnected();
    let dbs = DBS?.split(",") || [];
    // create models for each database (by country/entity)
    for (let db of dbs) {
        if (db == auditDbName) continue;
        // create models
        electoralLevelsModel = databaseConns[db].model("ElectoralLevels", electoralLevelsSchema, "ElectoralLevels");
        partyModel = databaseConns[db].model("Party", partySchema, "Parties");
        candidateModel = databaseConns[db].model("Candidate", candidateSchema, "Candidates");
    }
}

setup();


const Schema = mongoose.Schema;
const SchemaTypes = mongoose.SchemaTypes;

// -------------------- ElectoralLevels Schema
// Singleton, always have exactly one record
const electoralLevelsSchema = new Schema({
    // name, version: {}
    levels: [
        {
            name: SchemaTypes.String, // name e.g. 'region', 'constituency'
            uid: SchemaTypes.Number
        }
    ],
    // keep track of historical levels
    oldLevels: [
        {
            name: SchemaTypes.String, // name e.g. 'region', 'constituency'
            uid: SchemaTypes.Number
        }
    ]
});


// init model. Will be updated upon db connections in 'setup'
export let electoralLevelsModel = mongoose.model("ElectoralLevels", electoralLevelsSchema, "ElectoralLevels");
// --------------------

// -------------------- Party Schema
const partySchema = new Schema({
    name: SchemaTypes.String,
    initials: SchemaTypes.String
});

partySchema.index({initials: 1}, {unique: true});

// init model. Will be updated upon db connections in 'setup'
export let partyModel = mongoose.model("Party", partySchema, "Parties");
// --------------------


// -------------------- Candidate Schema
const candidateSchema = new Schema({
    electionId: SchemaTypes.String,
    partyId: SchemaTypes.String,
    surname: SchemaTypes.String,
    otherNames: SchemaTypes.String,
    title: SchemaTypes.String
});

// create a unique index for party
candidateSchema.index({electionId: 1, partyId: 1},
    {
        unique: true, //sparse: true, 
        partialFilterExpression: { partyId: {$type: 'string'} } // , $ne: ''
    }
);

candidateSchema.index({electionId: 1, surname: 1, otherNames: 1}, {unique: true});


// init model. Will be updated upon db connections in 'setup'
export let candidateModel = mongoose.model("Candidate", candidateSchema, "Candidates");

// --------------------

