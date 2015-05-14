"use strict";

var _ = require('lodash');
var token = require("../token.json").token;

module.exports = function (Dc, napp) {
    Dc.weixin = function (ctx, data, cb) {
        console.log(data);
    };

    Dc.expose('weinxin', {
        accepts: [
            {name: 'ctx', type: 'object', source: 'context'},
            {arg: 'data', type: 'object', source: 'body'}
        ],
        returns: {
            arg: 'result', type: 'object', root: true
        },
        http: {verb: 'get', path: '/'}
    });
};