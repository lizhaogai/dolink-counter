"use strict";

var sec = require('sira-core').sec;

module.exports = function (t) {
    return {
        properties: {},
        acls: [
            {
                principalType: sec.ROLE,
                principalId: sec.EVERYONE,
                permission: sec.DENY
            },
            {
                principalType: sec.ROLE,
                principalId: sec.EVERYONE,
                permission: sec.ALLOW,
                property: "weixin"
            }
        ]
    }
};