// Polling Agent Mongoose Model

import * as mongoose from "mongoose";
const debug = require('debug')('ea:pollagent-model');
debug.log = console.log.bind(console);
import { databaseConns, checkDatabaseConnected, auditDbName } from "../mongoose";
import { DBS } from "../../utils/env"
import paginate from "mongoose-paginate-v2";

// mongoose.set('debug', true);

/*
check db connection, then create model using db connection
*/
async function setup() {
    await checkDatabaseConnected();
    let dbs = DBS?.split(",") || [];
    for (let db of dbs) {
        if (db != auditDbName) continue;
        // audit db
        // now setup eaudit database for Poll Agents
        pollAgentModel = databaseConns[db].model<PollAgentDocument, mongoose.PaginateModel<PollAgentDocument> >
        ("PollAgent", pollAgentSchema, "PollAgents");
    }
}
setup();


const Schema = mongoose.Schema;
const SchemaTypes = mongoose.SchemaTypes;



// Poll Agent schema
const pollAgentSchema = new Schema({
    surname: SchemaTypes.String,
    otherNames: SchemaTypes.String,
    email: SchemaTypes.String,
    phone: SchemaTypes.String,
    password: SchemaTypes.String,
    otpCodes: [
        { code: SchemaTypes.String, createdAtms: SchemaTypes.Number }
    ],
    emailConfirmed: SchemaTypes.Boolean,
    phoneConfirmed: SchemaTypes.Boolean,
    //
    supervisorId: SchemaTypes.String, // id of supervisor
    subAgentsRef: SchemaTypes.String, // reference to subAgents/supervisees document
    //
    electoralLevel: SchemaTypes.String,
    electoralAreaId: SchemaTypes.String,
    electoralAreaName: SchemaTypes.String,
    //
    partyId: SchemaTypes.String,
    candidateId: SchemaTypes.String, // for independent candidates without parties
    country: SchemaTypes.String,
    // pollStations keyed by pollStation id and with value {name, id}
    pollStations: new Schema({

    }, {strict: false})
});

pollAgentSchema.index({email: 1}, 
    {unique: true, partialFilterExpression: {email: {$type: 'string', $ne: ''}} }
);

pollAgentSchema.index({phone: 1}, 
    {unique: true, partialFilterExpression: {phone: {$type: 'string', $ne: ''}} }
);

////////////////////
interface PollAgentData {
    surname: string,
    otherNames: string,
    email: {
        type: string,
        unique: true
    },
    phone: string,
    password: string,
    otpCodes: [
        { code: string, createdAtms: number }
    ],
    emailConfirmed: boolean,
    phoneConfirmed: boolean,
    //
    supervisorId: string, // id of supervisor
    subAgentsRef: string, // reference to subAgents/supervisees document
    //
    electoralLevel: string,
    electoralAreaId: string,
    electoralAreaName: string,
    //
    partyId: string,
    country: string,
    pollStations: object
};


// declare a mongoose document based on a Typescript interface representing your schema
interface PollAgentDocument extends mongoose.Document, PollAgentData {}

////////////////////

pollAgentSchema.plugin(paginate); // use paginate plugin

// init pollAgentModel to set right type. Will be updated upon db connections in setup
export let pollAgentModel = mongoose.model<PollAgentDocument, mongoose.PaginateModel<PollAgentDocument> >
("PollAgent", pollAgentSchema, "PollAgents");


pollAgentModel.on('index', function(err) {
    if (err) {
        console.error('PollAgents index error: %s', err);
    } else {
        console.info('PollAgents indexing complete');
    }
});
