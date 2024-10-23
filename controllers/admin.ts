import { Request, Response, NextFunction } from "express";
const debug = require('debug')('ea:ctrl-admin');
debug.log = console.log.bind(console);
import i18next from "i18next";
import { staffModel } from "../db/models/staff";
import { electoralLevelsModel } from "../db/models/others";
import { electionModel } from "../db/models/election";
import { electoralAreaModel } from "../db/models/electoral-area";
import { getStaffByIdSchema, electoralLevelsSchema, postElectionSchema } from "../utils/joi";
import { getJoiError } from "shared-lib/backend/misc";
import * as mongoose from "mongoose";



const pageLimit = 20;


/**
 * return all members of staff whose roles have not yet been assigned
 * @param req 
 * @param res 
 * @param next 
 */
export async function getStaffWithoutRoles(req: Request, res: Response, next: NextFunction) {
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


/**
 * get a particular staff member by Id
 * @param req 
 * @param res 
 * @param next 
 */
export async function getStaffById(req: Request, res: Response, next: NextFunction) {
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
export async function createElectoralLevels(req: Request, res: Response, next: NextFunction) {
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
    // debug('electoral levels from db: ', record);
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


/**
 * create election(s)
 * @param req 
 * @param res 
 * @param next 
 */
export async function postElection(req: Request, res: Response, next: NextFunction) {
    // check input
    let body = req.body;
    let { error } = await postElectionSchema.validate(body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }

    // check if there's already an upcoming election of this type, for this electoralAreaId
    let { type, electoralAreaId } = body;
    let dateNow = new Date().toISOString();
    let filter = { type, electoralAreaId, date: {$gte: dateNow} };
    let existElections = await electionModel.find(filter);
    debug('existElections: ', existElections);
    if (existElections.length > 0) {
        return Promise.reject({errMsg: i18next.t('entity_already_exists')});
    }

    // add single election if multi field not set, else add bulk
    let electionDate = new Date(body.date).toISOString();
    if (!body.multi?.includeAllValues) { // add single election
        debug('will add single election');
        body.multi = undefined; // not saving multi to db
        body.date = electionDate; //
        // add name of electoral area
        let electoralArea = await electoralAreaModel.findById(body.electoralAreaId);
        body.electoralAreaName = electoralArea?.name;
        await electionModel.create(body);
        return;
    }

    // Adding multiple elections, e.g creating parliamentary elections for all constituencies in a country
    debug('multi field set. Will add mulitple elections');
    // include all values of electoralLevel in multi.electoralLevelValue
    // get electoralLevels from db, start from multi.electoralLevel and iterate to electoralLevel.
    // At each level, pick the value and pick all sub electoral areas under it (i.e with parentLevelName 
    // equal this value)
    let multi = body.multi;
    let electoralLevelsRec = await electoralLevelsModel.findOne();
    let electoralLevels = electoralLevelsRec?.levels || [];
    let startLevelInd = electoralLevels.findIndex((val)=> val.name == multi.electoralLevel );
    let endLevelInd = electoralLevels.findIndex((val)=> val.name == body.electoralLevel);
    if (startLevelInd == -1 || endLevelInd == -1) {
        return Promise.reject({errMsg: i18next.t('request_body_error')});
    }

    // step through the electoral levels
    let curElectoralValues = [ multi.electoralLevelValue.toLowerCase() ];
    let electoralAreas: {[key: string]: any}[] = [];
    debug(`startLevelInd: ${startLevelInd}, endLevelInd: ${endLevelInd}`);
    // values at current level known, start from next one
    for (let levelInd= startLevelInd+1; levelInd<= endLevelInd; levelInd++) {
        // debug(`levelInd: ${levelInd}`);
        let level = electoralLevels[levelInd].name; // debug(`level: ${level}`);
        let filter = {level, parentLevelName: {$in: curElectoralValues}};
        electoralAreas = await electoralAreaModel.find(filter);
        // update curElectoralValues so can be used as parentLevelName in next iteration
        curElectoralValues = electoralAreas.map((el)=> el.nameLowerCase);
        // debug(`number(curElectoralValues): `, curElectoralValues.length);
    }
    
    // electoralAreas is array of electoral areas for which elections should be created
    // debug('electoralAreas: ', electoralAreas);
    debug(`number of elections to create: ${electoralAreas.length}`);
    let electionArray = electoralAreas.map((electArea)=>{
        let electData = {
            type: body.type,
            date: electionDate,
            electoralLevel: electArea.level,
            electoralAreaId: electArea._id,
            electoralAreaName: electArea.name
        };
        return electData;
    });
    // save to database
    await electionModel.collection.insertMany(electionArray);
}
