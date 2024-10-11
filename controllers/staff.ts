const debug = require('debug')('ea:ctrl-staff');
debug.log = console.log.bind(console);
import i18next from "i18next";
import { electoralLevelsModel } from "../db/models/others";
import { electoralAreaModel } from "../db/models/electoral-area";
import { Request, Response, NextFunction } from "express";
import { electoralAreaSchema } from "../utils/joi";




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
    let { error } = await electoralAreaSchema.validate(req.body);
    if (error) {
        debug('schema error: ', error);
        return Promise.reject({errMsg: i18next.t("request_body_error")});
    }
    // ?? ensure that the parentLevelName exists in electoralLevels ??
    // If parentLevelName not set, then it is the highest level i.e country, there should be only one area of highest
    // level. If the 'level' is the lowest, then it's a polling station (a unit for which results can be uploaded)
    
}
