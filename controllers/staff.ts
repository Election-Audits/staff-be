const debug = require('debug')('ea:ctrl-staff');
debug.log = console.log.bind(console);
import i18next from "i18next";
import { electoralLevelsModel } from "../db/models/others";
import { electoralAreaModel } from "../db/models/electoral-area";
import { Request, Response, NextFunction } from "express";
import { electoralAreaSchema, getElectoralAreaSchema } from "../utils/joi";
import { saveExcelDoc, getDataFromExcel, validateExcel, iterateDataRows } from "./files";
import { filesDir } from "../utils/misc";
import * as path from "path";




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
