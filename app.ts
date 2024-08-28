import express from "express";
const debug = require('debug')('ea:app');
debug.log = console.log.bind(console);
import * as path from "path";

// NB: can set DOTENV_CONFIG_PATH env, otherwise defaults to ./envs/.env
process.env.DOTENV_CONFIG_PATH ||= path.join(__dirname, "envs", ".env");
import "dotenv/config";

