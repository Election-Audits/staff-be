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
import { getStaffWithoutRoles, getStaffById, createElectoralLevels, postElection, postAgent, putAgent } 
from "../controllers/admin";
import { staffSession } from "../utils/session";


const router = express.Router({ mergeParams: true });

export default router;

router.use(express.json());

let cookieSecret = cookieSecretEnv +'';
// debug('cookieSecret from env: ', cookieSecret);

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
GET a list of members of staff in the given country
*/
router.get('/allstaff',
passport.authenticate('data-master-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /allstaff');
    getStaffWithoutRoles(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
GET a particular member of staff
*/
router.get('/staff/:staffId',
passport.authenticate('data-master-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /staff/:staffId');
    getStaffById(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err,req,res));
});


/* TODO
set the scope, roles etc. of a given member of staff
*/
// router.put('staff/:staffId')



/*
create electoral levels for a country: e.g. [country, ]
*/
router.post('/electoral-levels',
passport.authenticate('data-master-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to POST /electoralLevels');
    createElectoralLevels(req,res,next)
    .then(()=>{
        return res.status(200).send();
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
create an election
*/
router.post('/election',
passport.authenticate('data-master-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to POST /election...');
    postElection(req,res,next)
    .then(()=> res.status(200).end())
    .catch((err)=> endpointError(err, req, res));
});


/*
Add a polling agent (pre-approval) at the highest electoral levels: ('country' or 'region')
TODO: how to add supervisor agents for independent candidates: either create a dummy party for ind. cand. and
set this partyId when adding agent, or accept candidateId as an input, then add function to get independent
candidates to add to options when creating polling agents
Prefer option 2
*/
router.post('/agent',
passport.authenticate('data-master-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to POST /agent...');
    postAgent(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
Update an agent
*/
router.put('/agent/:id',
passport.authenticate('data-master-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to PUT /agent/:id...');
    putAgent(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=> endpointError(err,req,res));
});

