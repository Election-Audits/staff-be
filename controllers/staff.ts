const debug = require('debug')('ea:ctrl-staff');
debug.log = console.log.bind(console);
import i18next from "i18next";
import { electoralLevelsModel } from "../db/models/others";
import { electoralAreaModel } from "../db/models/electoral-area";
import { Request, Response, NextFunction } from "express";
import { electoralAreaSchema } from "../utils/joi";
import { saveExcelDoc, getDataFromExcel, validateExcel } from "./files";




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
    let sheetData = await getDataFromExcel(req.myFileName);
    const requiredColumns = ['name', 'level', 'parentLevelName'];
    await validateExcel(sheetData, requiredColumns);

}


// function excelRowsToDataObjects() {
// }
