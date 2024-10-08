'use strict';

// Mongoose Models

const mongoose = require('mongoose');
const debug = require('debug')('ea:models');
debug.log = console.log.bind(console);
const { databaseConns, checkDatabaseConnected } = require('./mongoose');
const { DBS } = require('../utils/env');
const paginate = require('mongoose-paginate-v2');


let staffModel; // = ()=>{}

async function setup() {
    await checkDatabaseConnected();
    let dbs = DBS?.split(",") || [];
    // create models for each database (by country/entity)
    // let isGeneralDbPresent = false;
    for (let db of dbs) {
        if (db == 'eaudit') continue;
        
    }
    // now setup eaudit database for staff app
    staffModel = databaseConns.eaudit.model("Staff", staffSchema, "Staff");
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


// staffSchema.plugin(paginate); //TODO use paginate plugin


module.exports = {
    getStaffModel: ()=> staffModel
};
