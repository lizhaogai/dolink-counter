"use strict";

var requireAll = require('require-all');
var _ = require('lodash');

exports.init = function (napp) {
    var adapters = requireAll(__dirname + '/adapters');
    return new Counter(napp, adapters);
};

function Counter(napp, adapters) {
    var self = this;
    this.napp = napp;
    this.adapters = adapters;
    _.forIn(this.adapters, function (adapter) {
        adapter.init(napp);
    });

    var channel = napp.bus.subscribe('$device/:did/channel/:cid/event/:eventName');
    channel.on('data', function (message, router) {
        if (message) {
            self.onData(router.params.did, router.params.cid, message);
        }
    });
}

Counter.prototype.onData = function (deviceId, channelId, message) {
    var self = this;
    var DeviceCounter = this.napp.model('DeviceCounter');
    DeviceCounter.findOne({
        where: {
            deviceId: deviceId
        }
    }, function (err, deviceCounter) {
        if (err) return;
        if (!deviceCounter) return;
        var settings = deviceCounter.settings;

        if ((new Date()) - deviceCounter.lastUpdate < deviceCounter.ttl * 1000) {
            return;
        }

        if (self.adapters[deviceCounter.type] && self.adapters[deviceCounter.type].execute) {
            self.adapters[deviceCounter.type].execute(deviceCounter.ownerId, settings, function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (!err) {
                    if (self.napp.rpcClient.channel(deviceId, channelId)) {
                        deviceCounter.updateAttributes({lastUpdate: new Date()});
                        self.napp.rpcClient.channel(deviceId, channelId).request('display', {text: result}, function () {
                        });
                    }
                }
            });
        }
    });
};

