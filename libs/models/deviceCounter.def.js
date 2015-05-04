"use strict";

var sec = require('sira-core').sec;

module.exports = function (t) {
    return {
        properties: {
            id: {type: Number, index: true},
            ownerId: {type: String, index: true},
            deviceId: {type: String, index: true},
            type: {type: String, index: true},
            enable: {type: Boolean, index: true},
            lastUpdate: {type: Date},
            settings: {type: t.JSON}
        },
        acls: [
            {
                principalType: sec.ROLE,
                principalId: sec.EVERYONE,
                permission: sec.DENY
            },
            {
                principalType: sec.ROLE,
                principalId: sec.AUTHENTICATED,
                permission: sec.ALLOW,
                property: "updateSettings"
            },
            {
                principalType: sec.ROLE,
                principalId: sec.AUTHENTICATED,
                permission: sec.ALLOW,
                property: "findSettings"
            },
            {
                principalType: sec.ROLE,
                principalId: sec.AUTHENTICATED,
                permission: sec.ALLOW,
                property: "serviceState"
            }
        ]
    }
};