'use strict';
/*
Admin functions: set scope on admins that signed up
*/

const debug = require('debug')('ea:rte-admin');
debug.log = console.log.bind(console);
import * as express from "express";
import { endpointError } from "shared-lib/backend/misc";
import passport from "passport";
import { COOKIE_SECRET as cookieSecretEnv, BUILD } from "../utils/env";
import cookieParser from "cookie-parser";
import { secrets , checkSecretsReturned } from "../utils/infisical";
import { BUILD_TYPES } from "shared-lib/constants";
import { getStaffWithoutRoles } from "../controllers/admin";
import { staffSession } from "../utils/session";


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
staffSession,
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
