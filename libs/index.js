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

    var channel = napp.bus.subscribe('node');
    channel.on('data', function (message) {
        if (message) {
            self.onData(message);
        }
    });
}

Counter.prototype.onData = function (message) {
    var self = this;
    var DeviceCounter = this.napp.model('DeviceCounter');
    DeviceCounter.findOne({
        where: {
            ownerId: message.ownerId,
            deviceId: message.deviceId
        }
    }, function (err, deviceCounter) {
        if (err) return;
        if (!deviceCounter) return;
        var settings = deviceCounter.settings;

        //TODO find the channel, judge if it is timeout now

        settings.ownerId = message.ownerId;
        if (this.adapters[deviceCounter.type] && this.adapters[deviceCounter.type].execute) {
            this.adapters[deviceCounter.type].execute(settings, function (err, result) {
                if (!err) {
                    if (self.napp.rpcClient().channel(message.deviceId, message.channelId) && self.napp.rpcClient().channel(message.deviceId, message.channelId).display)
                        self.napp.rpcClient().channel(message.deviceId, message.channelId).display(result);
                }
            });
        }
    });
};

