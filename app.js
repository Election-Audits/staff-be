'use strict';

import * as path from "path";
// NB: can set DOTENV_CONFIG_PATH env, otherwise defaults to ./envs/.env
process.env.DOTENV_CONFIG_PATH ||= path.join(__dirname, "envs", ".env");
import "dotenv/config";

import express from "express";
const debug = require('debug')('ea:app');
debug.log = console.log.bind(console);
import "./auth"; // passport setup


import loginRouter from "./routes/login";
import adminRouter from "./routes/admin";


const app = express();
const port = process.env.PORT || 3010;
app.listen(port, ()=>{
    debug('starting at: ', new Date());
    console.log(`app is listening on port ${port}`);
});

// a ping to check if app is running
app.get('/ping', (req,res,next)=>{
    res.send("App (staff) is running");
});


// mount routers
app.use("/", loginRouter);
app.use("/", adminRouter);


// TODO: 400 handler


app.use((err, req, res, next)=>{
    debug('error handler. err: ', err);
    let status = err?.errMsg ? 400 : 500;
    let body = err?.errMsg || 'Internal Server Error';
    return res.status(status).send(body);
});
