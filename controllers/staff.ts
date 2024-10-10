const debug = require('debug')('ea:ctrl-staff');
debug.log = console.log.bind(console);
import i18next from "i18next";
import { electoralLevelsModel } from "../db/models/others";
import { Request, Response, NextFunction } from "express";




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



