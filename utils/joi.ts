// Input validation

const debug = require('debug')('ea:joi');
debug.log = console.log.bind(console);
import * as Joi from "joi";



// reused validation fields
const email = Joi.string().email().min(3).max(30);
const password = Joi.string().min(8).max(30);
const phone = Joi.number();


// schema for signup endpoint
export const signupSchema = Joi.object({
    email: email.required(),
    password: password.required(),
    surname: Joi.string().max(50).required(), // .disallow(['=%_;$*'])
    otherNames: Joi.string().max(50).required(),
    phone,
});


// schema for signupConfirm endpoint
export const signupConfirmSchema = Joi.object({
    email: email.required(),
    code: Joi.string().alphanum().max(20).required()
});


// schema for login endpoint
export const loginSchema = Joi.object({
    email: email.required(),
    password: password.required()
});


export const loginConfirmSchema = Joi.object({
    email: email.required(),
    code: Joi.string().alphanum().max(20).required()
});


export const getStaffByIdSchema = Joi.object({
    staffId: Joi.string().alphanum().max(30)
});


// electoralLevels
export const electoralLevelsSchema = Joi.object({
    levels: Joi.array().items(
        Joi.string().max(50)
    )
});


// electoral areas
export const electoralAreaSchema = Joi.object({
    name: Joi.string().max(100),
    level: Joi.string().max(50),
    parentLevelName: Joi.string().max(100),
    parentLevelId: Joi.string().max(30),
    location: {
        lon: Joi.number(),
        lat: Joi.number()
    },
    locationDetails: Joi.string()
});


//
export const getElectoralAreaSchema = Joi.object({
    areaId: Joi.string().alphanum().max(30)
});


// post election
export const postElectionSchema = Joi.object({
    type: Joi.string().max(50),
    date: Joi.string().max(50),
    electoralLevel: Joi.string().max(50), // e.g country, constituency
    electoralAreaId: Joi.string().alphanum().max(30), // id of constituency
    multi: {
        includeAllValues: Joi.boolean(),
        electoralLevel: Joi.string().max(50),
        electoralLevelValue: Joi.string().max(100)
    }
});


// get elections
export const getElectionsSchema = Joi.object({
    pg: Joi.number(),
    type: Joi.string().max(50)
});


// get a specific election
export const getOneElectionSchema = Joi.object({
    id: Joi.string().alphanum().max(30)
});


// Add a political pary
export const postPartySchema = Joi.object({
    name: Joi.string().max(100),
    initials: Joi.string().max(20)
});

// objectId schema
export const objectIdSchema = Joi.object({
    id: Joi.string().alphanum().max(30)
});
