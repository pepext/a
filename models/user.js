'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    crypto = require('crypto');

var UserSchema = new Schema({
    id:  String,
    userId: String,
    first_name: String,
    last_name:   String,
    email: String,
    userPhoto: { height: Number, width: Number, url: String },
    boxCount: Number,
    provider: String,
    access_token: String
});

var User = mongoose.model('User', UserSchema);

module.exports = {"User": User};