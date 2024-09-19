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
