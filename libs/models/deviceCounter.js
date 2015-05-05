"use strict";

var _ = require('lodash');
module.exports = function (DeviceCounter, napp) {

    DeviceCounter.validatesPresenceOf('deviceId');

    DeviceCounter.serviceState = function (ownerId, type, cb) {
        var UserCredential = napp.model('UserCredential');
        UserCredential.findOne({
            where: {
                userId: ownerId,
                provider: type + '-link'
            }
        }, function (err, userCredential) {
            if (err)
                return cb(err);
            return cb(null, !!userCredential);
        });
    };

    DeviceCounter.updateSettings = function (ownerId, deviceId, data, cb) {
        DeviceCounter.findOrCreate({where: {deviceId: deviceId}}, function (err, deviceCounter) {
            if (err) return cb(err);
            deviceCounter.updateAttributes({
                settings: data.settings,
                type: data.type,
                ownerId: ownerId,
                ttl: data.ttl
            }, cb);
        });
    };

    DeviceCounter.getSettings = function (ownerId, deviceId, cb) {
        DeviceCounter.findOne({where: {ownerId: ownerId, deviceId: deviceId}}, function (err, deviceCounter) {
            if (err) return cb(null);
            return cb(null, deviceCounter);
        });
    };

    DeviceCounter.expose('updateSettings', {
        accepts: [
            {
                arg: 'ownerId', type: 'string',
                source: function (ctx) {
                    return ctx.req.accessToken && ctx.req.accessToken.userId;
                }
            },
            {arg: 'deviceId', type: 'string'},
            {arg: 'data', type: 'object', source: 'body'}
        ],
        returns: {
            arg: 'result', type: 'object', root: true
        },
        http: {verb: 'put', path: '/:deviceId'}
    });

    DeviceCounter.expose('getSettings', {
        accepts: [
            {
                arg: 'ownerId', type: 'string',
                source: function (ctx) {
                    return ctx.req.accessToken && ctx.req.accessToken.userId;
                }
            },
            {arg: 'deviceId', type: 'string'}
        ],
        returns: {
            arg: 'result', type: 'object', root: true
        },
        http: {verb: 'get', path: '/:deviceId'}
    });

    DeviceCounter.expose('serviceState', {
        accepts: [
            {
                arg: 'ownerId', type: 'string',
                source: function (ctx) {
                    return ctx.req.accessToken && ctx.req.accessToken.userId;
                }
            },
            {arg: 'type', type: 'string'}
        ],
        returns: {
            arg: 'result', type: 'object', root: true
        },
        http: {verb: 'get', path: '/service/:type/state'}
    });
};