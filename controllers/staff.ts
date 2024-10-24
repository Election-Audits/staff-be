const debug = require('debug')('ea:ctrl-staff');
debug.log = console.log.bind(console);
import i18next from "i18next";
import { electoralLevelsModel, partyModel, candidateModel } from "../db/models/others";
import { electoralAreaModel } from "../db/models/electoral-area";
import { electionModel } from "../db/models/election";
import { Request, Response, NextFunction } from "express";
import { electoralAreaSchema, getElectoralAreaSchema, getElectionsSchema, getOneElectionSchema, postPartySchema,
objectIdSchema, postCandidateSchema } from "../utils/joi";
import { saveExcelDoc, getDataFromExcel, validateExcel, iterateDataRows } from "./files";
import { filesDir, pageLimit, getQueryNumberWithDefault } from "../utils/misc";
import * as path from "path";
import { pollAgentModel } from "../db/models/poll-agent";




/**
 * get the electoral area levels (e.g ['country','region','constituency','polling station'])
 * @param req 
 * @param res 
 * @param next 
 */
export async function getElectoralLevels(req: Request, res: Response, next: NextFunction) {
    let record = await electoralLevelsModel.findOne();
    debug('electoral level record: ', record);
    let levels = record?.levels.map((lvl)=> lvl.name) || [];
    return levels;
}


/**
 * add an electoral area, e.g a specific polling station, constitution
 * @param req 
 * @param res 
 * @param next 
 */
export async function postElectoralArea(req: Request, res: Response, next: NextFunction) {
    // check input
    let body = req.body;
    let { error } = await electoralAreaSchema.validate(body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }

    body.nameLowerCase = body.name.toLowerCase(); // add nameLowerCase for easy consistent searching
    // ensure that the parentLevelName exists in electoralLevels
    if (body.parentLevelName) { // adding other electoral area apart from the country
        let record = await electoralAreaModel.findOne({nameLowerCase: body.parentLevelName.toLowerCase()});
        if (!record) {
            return Promise.reject({errMsg: i18next.t('parent_area_not_exist')});
        }
    } else { // adding the country. There should be exactly one record of this
        // Ensure it doesn't already exist. get electoralLevels
        let electoralLevels = await electoralLevelsModel.findOne();
        let highestElectoralLevel = electoralLevels?.levels[0].name;
        let highestElectoralArea = await electoralAreaModel.findOne({level: highestElectoralLevel});
        debug('highestElectoralArea: ', highestElectoralArea);
        if (highestElectoralArea) { // country record already exists. Can only be one
            return Promise.reject({errMsg: i18next.t('entity_already_exists')});
        }
    }
    
    // save electoral area
    let electoralArea = new electoralAreaModel(body);
    await electoralArea.save(); // .create
}


/**
 * Bulk add of electoral areas using upload of excel file
 * @param req 
 * @param res 
 * @param next 
 */
export async function postElectoralAreaBulk(req: Request, res: Response, next: NextFunction) {
    // save excel document
    await saveExcelDoc(req,res,next);
    // validate contents of excel document. columns matching
    let filePath = path.join(filesDir, req.myFileName);
    let sheetData = await getDataFromExcel(filePath);
    const requiredColumns = ['name', 'level', 'parentLevelName'];
    let { numHeaders, expectedHeaderMap } = await validateExcel(sheetData, requiredColumns);
    let dataArr = iterateDataRows(sheetData, numHeaders, expectedHeaderMap); // await
    await checkDuplicatesElectoralAreaBulk(dataArr);
    // transform each data element to match database schema (add fields)
    // TODO: special consideration if adding regions
    dataArr = dataArr.map((el)=>{
        el.nameLowerCase = el.name.toLowerCase();
        return el;
    });
    // perform a bulk write to database
    await electoralAreaModel.collection.insertMany(dataArr);
}


/**
 * Ensure that there are no duplicates of electoral area data in uploaded xlsx file
 * @param rowsArray 
 * @returns 
 */
async function checkDuplicatesElectoralAreaBulk(rowsArray: {[key: string]: any}[]) { // ElectoralAreaData
    // track data by keys: parentLevelName, then name, to find duplicates in same parent electoral area
    let dataMap: {[key: string]: {[key: string]: object}} = {};
    let duplicates = []; // keep track of duplicates
    for (let rowObj of rowsArray) {
        // also write in data map to ensure no duplicates in data
        let parentNameLowerCase = rowObj.parentLevelName?.toLowerCase();
        let myNameLowerCase = rowObj.name.toLowerCase();
        // init parentLevelName store of electoral areas if doesn't exist
        if (!dataMap[parentNameLowerCase]) dataMap[parentNameLowerCase] = {}; // toLowerCase?
        if (dataMap[parentNameLowerCase][myNameLowerCase]) { // record already exists
            duplicates.push(rowObj.name);
        }
        dataMap[parentNameLowerCase][myNameLowerCase] = rowObj; // add row object to data map
    }
    //
    // reject with error if there is duplicate data in excel sheet
    if (duplicates.length > 0) {
        let errMsg = i18next.t('duplicates_in_input') +' '+ duplicates;
        return Promise.reject({errMsg});
    }
}


/**
 * Get a specific electoral area e.g a specific polling station, constituency etc.
 * @param req 
 * @param res 
 * @param next 
 */
export async function getElectoralArea(req: Request, res: Response, next: NextFunction) {
    // check input
    let { error } = await getElectoralAreaSchema.validate(req.params);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }
    let areaId = req.params.areaId;
    let electoralArea = await electoralAreaModel.findById({_id: areaId});
    return electoralArea;
}


/**
 * Get all upcoming elections in a country
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export async function getElections(req: Request, res: Response, next: NextFunction) {
    // check input
    let { error } = await getElectionsSchema.validate(req.query);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }
    let page = getQueryNumberWithDefault(req.query?.pg); debug('page: ', page);
    let type = req.query.type; // e.g. presidential
    let filter: {'type'?: unknown} = {}; // query filter
    if (type) filter.type = type;
    // pagination options
    let options = { page, limit: pageLimit };
    let electionsRet = await electionModel.paginate(filter, options);
    // debug('electionsRet: ', electionsRet);
    return { results: electionsRet.docs };
}


/**
 * gets a specific election
 * @param req 
 * @param res 
 * @param next 
 */
export async function getOneElection(req: Request, res: Response, next: NextFunction) {
    // check input
    let { error } = await getOneElectionSchema.validate(req.params);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }
    let electionId = req.params.id;
    let election = await electionModel.findById(electionId);
    return election;
}


/**
 * Add a political party. TODO: save party logo in db or S3
 * @param req 
 * @param res 
 * @param next 
 */
export async function postParty(req: Request, res: Response, next: NextFunction) {
    // check input
    let { error } = await postPartySchema.validate(req.body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }
    //
    await partyModel.create(req.body);
}


/**
 * Get all political parties
 * @param req 
 * @param res 
 * @param next 
 */
export async function getParties(req: Request, res: Response, next: NextFunction) {
    let parties = await partyModel.find();
    return parties;
}


/**
 * GET a specific political party
 * @param req 
 * @param res 
 * @param next 
 */
export async function getOneParty(req: Request, res: Response, next: NextFunction) {
    // check input
    let { error } = await objectIdSchema.validate(req.params);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }
    //
    let party = await partyModel.findById(req.params.id);
    return party;
}


/**
 * update a political party
 * @param req 
 * @param res 
 * @param next 
 */
export async function updateParty(req: Request, res: Response, next: NextFunction) {
    // check param input
    let { error } = await objectIdSchema.validate(req.params);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }

    // check body input
    let { error: bodyError } = await postPartySchema.validate(req.body);
    if (bodyError) {
        debug('schema error: ', bodyError);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }

    // TODO: check approaching elections and disallow changes too close to an election?
    // update party
    let filter = {_id: req.params.id};
    await partyModel.updateOne(filter, {$set: req.body});
}


/**
 * Add a candidate to an election
 * @param req 
 * @param res 
 * @param next 
 */
export async function postCandidate(req: Request, res: Response, next: NextFunction) {
    // check input with Joi
    let { error } = await postCandidateSchema.validateAsync(req.body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }

    // write candidate db.
    let createRet = await candidateModel.create(req.body);
    // debug('createRet: ', createRet);
    return {
        id: createRet._id
    };
}


/**
 * Update a candidate of an election
 * @param req 
 * @param res 
 * @param next 
 */
export async function updateCandidate(req: Request, res: Response, next: NextFunction) {
    // check param input with Joi. 
    let { error } = await objectIdSchema.validateAsync(req.params);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }

    // now check body input
    let { error: bodyError } = await postCandidateSchema.validateAsync(req.body);
    if (bodyError) {
        debug('schema error: ', bodyError);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }


    // update record
    let filter = {_id: req.params.id};
    await candidateModel.updateOne(filter, {$set: req.body});
}


/**
 * get a poll station agent
 * @param req 
 * @param res 
 * @param next 
 */
export async function getAgent(req: Request, res: Response, next: NextFunction) {
    // Joi input check for id param
    let { error } = await objectIdSchema.validateAsync(req.params);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }

    let agent = await pollAgentModel.findById(req.params.id);
    return agent;
}


