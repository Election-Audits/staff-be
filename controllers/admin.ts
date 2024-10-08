import * as express from "express";
const debug = require('debug')('ea:ctrl-admin');
debug.log = console.log.bind(console);
import i18next from "i18next";
import { } from "../utils/joi"; // TODO
import { staffModel } from "../db/models";


const pageLimit = 20;


/**
 * return all members of staff whose roles have not yet been assigned
 * @param req 
 * @param res 
 * @param next 
 */
export async function getStaffWithoutRoles(req: express.Request, res: express.Response, next: express.NextFunction) {
    let filter = {roles: {$exists: false}}; // users where roles field not set
    // assertNumber(req.query.pg); // ensure that query.pg is a number
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
