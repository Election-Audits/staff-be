/*
Endpoints that can be accessed by all staff data roles
*/

const debug = require('debug')('ea:rte-staff');
debug.log = console.log.bind(console);
import * as express from "express";
import { endpointError } from "shared-lib/backend/misc";
import passport from "passport";
import { COOKIE_SECRET as cookieSecretEnv, BUILD } from "../utils/env";
import cookieParser from "cookie-parser";
import { secrets , checkSecretsReturned } from "../utils/infisical";
import { BUILD_TYPES } from "shared-lib/constants";
import { staffSession } from "../utils/session";
import { getElectoralLevels, postElectoralArea } from "../controllers/staff";


const router = express.Router({ mergeParams: true });

export default router;


router.use(express.json());

let cookieSecret = cookieSecretEnv +'';

router.use(cookieParser(cookieSecret));
router.use((req,res,next)=> staffSession(req,res,next));

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
GET the electoral levels in a country
*/
router.get('/electoral-levels',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /electoral-levels...');
    getElectoralLevels(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
POST electoral area
*/
router.post('/electoral-area',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to POST /electoral-area...');
    postElectoralArea(req,res,next)
    .then(()=>{
        res.status(200).end()
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
BULK add of electoral areas
*/
router.post('/electoral-area/bulk',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to POST /electoral-area/bulk');
    
});
