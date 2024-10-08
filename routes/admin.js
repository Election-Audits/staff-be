'use strict';
/*
Admin functions: set scope on admins that signed up
*/

const debug = require('debug')('ea:rte-admin');
debug.log = console.log.bind(console);
const express = require('express');
const { endpointError } = require('shared-lib/backend/misc');
const passport = require('passport');
const { COOKIE_SECRET: cookieSecretEnv, BUILD } = require('../utils/env');
const cookieParser = require('cookie-parser');
const { secrets , checkSecretsReturned } = require('../utils/infisical');
const { BUILD_TYPES } = require('shared-lib/constants');
const { getStaffWithoutRoles } = require('../controllers/admin');
const { staffSession } = require('../utils/session');


const router = express.Router();

router.use(express.json());


let cookieSecret = cookieSecretEnv +'';

// router.use(staffSession); TODO
// router.use(cookieParser(cookieSecret));


/*
Obtain secrets (cookie), set up cookie parser
*/
async function setup() {
    await checkSecretsReturned();
    // set cookie secret for cloud build. Will be used by cookieParser
    cookieSecret = (BUILD == BUILD_TYPES.local) ? cookieSecretEnv+'' : secrets.COOKIE_SECRET;
}

setup();


/*
GET a list of members of staff in the given country
*/
router.get('/allstaff',
cookieParser(cookieSecret),
(req,res,next)=>{ staffSession(req,res,next); },
passport.authenticate('data-master-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /allstaff');
    getStaffWithoutRoles(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err,req,res));
});



module.exports = router;
