'use strict';

import * as express from "express";
const debug = require('debug')('ea:ctrl-admin');
debug.log = console.log.bind(console);
import i18next from "i18next";
// TODO  "../utils/joi"
import { } from "../db/models";


const pageLimit = 20;


/**
 * return all members of staff whose roles have not yet been assigned
 * @param req 
 * @param res 
 * @param next 
 */
async function getStaffWithoutRoles(req, res, next) {
    let filter = {roles: {$exists: false}}; // users where roles field not set
    // assertNumber(req.query.pg); // ensure that query.pg is a number
    let page = getQueryNumberWithDefault(req.query?.pg); // get page from query or start with 1
    let options = { page, limit: pageLimit };
    let staff = await staffModel.paginate(filter, options);
    debug('staff ret: ', staff);
    // let staffRet = staff.map((x)=>{
    //     return {}
    // });
}



module.exports = {
    getStaffWithoutRoles
};
