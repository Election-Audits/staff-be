import * as mongoose from "mongoose";
const debug = require('debug')('ea:mongoose');
debug.log = console.log.bind(console);
import { BUILD_TYPES } from "shared-lib/constants";
import { BUILD } from "../utils/env";


// set connection string depending on whether it's a local or cloud build
const protocol = (BUILD == BUILD_TYPES.local) ? 'mongodb' : 'mongodb+srv';
const mongoUrlBase = (BUILD == BUILD_TYPES.local) ? '127.0.0.1:27017' : ''; // TODO: set cloud urls
let mongoCreds : string; // mongodb credentials


// setup functions to run
async function setup () {
    // get secrets from Infisical
}
