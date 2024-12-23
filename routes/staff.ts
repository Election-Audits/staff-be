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
import { getElectoralLevelsRequest, postElectoralArea, postElectoralAreaBulk, getElectoralArea, getElections, getOneElection,
postParty, getParties, getOneParty, updateParty, postCandidate, updateCandidate, getAgent, getCandidates } 
from "../controllers/staff";
import multer from "multer";


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
    getElectoralLevelsRequest(req,res,next)
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
    postElectoralAreaBulk(req, res, next)
    .then(()=>{
        res.status(200).end()
    })
    .catch((err)=> endpointError(err, req, res));
});


// TODO: Update a specific electoral area


/*
GET a specific electoral area
*/
router.get('/electoral-area/:areaId',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /electoral-area/:areaId');
    getElectoralArea(req, res, next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err, req, res));
});


/*
GET upcoming elections for a country
*/
router.get('/elections',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /elections...');
    debug('query: ', req.query);
    getElections(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err, req, res));
});


/*
GET a specific election
*/
router.get('/election/:id',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /election/:electionId...');
    getOneElection(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err, req, res));
});


/*
Add a political party
*/
router.post('/party',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to POST /party...');
    postParty(req,res,next)
    .then(()=> res.status(200).end())
    .catch((err)=> endpointError(err,req,res));
});


/*
GET all political parties
*/
router.get('/parties',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /parties...');
    getParties(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
GET a specific political party
*/
router.get('/party/:id',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET one political party...');
    getOneParty(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err, req, res));
});


/*
Update a political party
*/
router.put('/party/:id',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to update a political party...');
    updateParty(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
Add a candidate to an election
*/
router.post('/candidate',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to POST /candidate...');
    postCandidate(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
Update a candidate of an election
*/
router.put('/candidate/:id',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to update /candidate/:id...');
    updateCandidate(req,res,next)
    .then(()=>{
        return res.status(200).end();
    })
    .catch((err)=> endpointError(err,req,res));
});


// TODO: PUT /candidate/:id/picture


/*
GET a polling agent
*/
router.get('/agent/:id',
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to get /agent/:id');
    getAgent(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err,req,res));
});


/*
GET candidates of an election
*/
router.get('/candidates', // ?electionId=<>&filter=<>
passport.authenticate('staff-cookie', {session: false}),
(req,res,next)=>{
    debug('received request to GET /candidates?...');
    getCandidates(req,res,next)
    .then((data)=>{
        return res.status(200).send(data);
    })
    .catch((err)=> endpointError(err,req,res));
});



