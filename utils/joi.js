'use strict';

// Input validation

const debug = require('debug')('ea:joi');
debug.log = console.log.bind(console);
const Joi = require('joi');



// reused validation fields
const email = Joi.string().email().min(3).max(30);
const password = Joi.string().min(8).max(30);
const phone = Joi.number();


// schema for signup endpoint
const signupSchema = Joi.object({
    email: email.required(),
    password: password.required(),
    surname: Joi.string().max(50).required(), // .disallow(['=%_;$*'])
    otherNames: Joi.string().max(50).required(),
    phone,
});


// schema for signupConfirm endpoint
const signupConfirmSchema = Joi.object({
    email: email.required(),
    code: Joi.string().alphanum().max(20).required()
});


// schema for login endpoint
const loginSchema = Joi.object({
    email: email.required(),
    password: password.required()
});


const loginConfirmSchema = Joi.object({
    email: email.required(),
    code: Joi.string().alphanum().max(20).required()
});



module.exports = {
    signupSchema,
    signupConfirmSchema,
    loginSchema,
    loginConfirmSchema
};
