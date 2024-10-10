import * as express from "express";
const debug = require('debug')('ea:ctrl-admin');
debug.log = console.log.bind(console);
import i18next from "i18next";
import { } from "../utils/joi"; // TODO
import { staffModel } from "../db/models/staff";
import { electoralLevelsModel } from "../db/models/others";
import { getStaffByIdSchema, electoralLevelsSchema } from "../utils/joi";
import { getJoiError } from "shared-lib/backend/misc";
import * as mongoose from "mongoose";


const pageLimit = 20;


/**
 * return all members of staff whose roles have not yet been assigned
 * @param req 
 * @param res 
 * @param next 
 */
export async function getStaffWithoutRoles(req: express.Request, res: express.Response, next: express.NextFunction) {
    let filter = {roles: {$exists: false}}; // users where roles field not set
    // NB: input check achieved in getQueryNumberWithDefault. ensure that query.pg is a number. 
    let page = getQueryNumberWithDefault(req.query?.pg); // get page from query or start with 1
    // set projection. The fields that should be returned for every object
    let projection = {_id: 1, email: 1, surname: 1, otherNames: 1, scope: 1, roles: 1};
    let options = { page, limit: pageLimit, projection };
    let staffRet = await staffModel.paginate(filter, options);
    debug('staff ret: ', staffRet);
    return { staff: staffRet.docs };
}

/**
 * Ensure that a query parameter yields a number, even when undefined
 * @param queryIn a query parameter
 * @returns 
 */
function getQueryNumberWithDefault(queryIn: unknown) : number {
    let queryAsNumber = parseInt(queryIn+'');
    if (Number.isFinite(queryAsNumber)) return queryAsNumber;
    else return 1; // start from page 1
}


// // Assert argument is a number
// function assertNumber(val: unknown) : asserts val is number{
//     if (typeof val !== 'number') throw Error('Not a number')
// }


/**
 * get a particular staff member by Id
 * @param req 
 * @param res 
 * @param next 
 */
export async function getStaffById(req: express.Request, res: express.Response, next: express.NextFunction) {
    // check param input
    let { error } = await getStaffByIdSchema.validate(req.params);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }
    let staffId = req.params.staffId;
    let projection = {password: 0, emailCodes: 0}; // fields to return/ignore
    let staff = await staffModel.findById(staffId, projection);
    debug('staff: ', staff);
    return staff;
}


// TODO: updateStaffByDataMaster


/**
 * create electoral levels for a country e.g. [country, region, constituency, polling-station]
 * @param req 
 * @param res 
 * @param next 
 */
export async function createElectoralLevels(req: express.Request, res: express.Response, next: express.NextFunction) {
    // check input
    let { error } = await electoralLevelsSchema.validate(req.body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }
    let levelsIn : string[] = req.body.levels;
    // convert input electoral levels to lower case
    levelsIn = levelsIn.map((lvl)=> lvl.toLowerCase());
    // get the electoral levels from the database
    let record = await electoralLevelsModel.findOne({});
    debug('electoral levels from db: ', record);
    // if record exists, need to see which levels to move to oldLevels, which to delete
    // create objects of levels and oldLevels for efficient access
    let levelsObj_0: {[key: string]: {}} = {};
    let oldLevelsObj_0: {[key: string]: {}} = {};
    record?.levels.map((lvl)=>{
        levelsObj_0[lvl.name+''] = lvl
    });
    record?.oldLevels.map((lvl)=>{
        oldLevelsObj_0[lvl.name+''] = lvl;
    });
    // iterate through input levels, create new level array. If level exists, use its existing uid.
    let levels = [];
    let uidsInLevels = record?.levels.map((lvl)=> lvl.uid || 0) || []; // todo: use asserts for uid
    let uidsInOldLevels = record?.oldLevels.map((lvl)=> lvl.uid || 0) || [];
    let maxUid = Math.max(0, ...uidsInLevels, ...uidsInOldLevels);
    debug('maxUid: ', maxUid);
    for (let levelIn of levelsIn) {
        if (levelsObj_0[levelIn]) levels.push(levelsObj_0[levelIn]);
        else if (oldLevelsObj_0[levelIn]) levels.push(oldLevelsObj_0[levelIn]);
        else {
            let level = {name: levelIn, uid: maxUid+1};
            levels.push(level);
            maxUid++;
        }
    }
    // Now iterate through database levels, if a level in db not in input, move it to oldLevels
    let levels_0 = record?.levels || [];
    let oldLevels = record?.oldLevels || new mongoose.Types.DocumentArray<any>([]);
    let levelsInObj: {[key: string]: boolean} = {}; // create object out of input levels array
    levelsIn.map((lvl)=>{
        levelsInObj[lvl] = true;
    });
    //
    for (let dbLevel of levels_0) {
        if (!levelsInObj[dbLevel.name+'']) oldLevels.push(dbLevel);
    }
    let setFields = {
        levels,
        oldLevels
    };
    //
    await electoralLevelsModel.updateOne({}, {$set: setFields}, {upsert: true});
}
// TODO: handle case of an entry that would move from oldLevels to levels
// TODO: lock on creating electoralLevels to ensure one admin writing at a time
