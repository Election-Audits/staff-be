'use strict';

const express = require('express');
const debug = require('debug')('ea:ctrl-admin');
debug.log = console.log.bind(console);
const i18next = require('i18next');
// TODO  "../utils/joi"
const { getStaffModel } = require("../db/models");


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
    let page = req.query?.pg || 1; // get page from query or start with 1
    // set projection. The fields that should be returned for every object
    let projection = {_id: 1, email: 1, surname: 1, otherNames: 1, scope: 1, roles: 1};
    let options = { page, limit: pageLimit, projection };
    let staffModel = getStaffModel();
    let staffRet = await staffModel.paginate(filter, options);
    debug('staff ret: ', staffRet);
    return {staff: staffRet.docs};
}



module.exports = {
    getStaffWithoutRoles
};
