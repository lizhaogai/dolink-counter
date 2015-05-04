"use strict";

var requireAll = require('require-all');
var _ = require('lodash');

exports.init = function (napp) {
    var adapters = requireAll(__dirname + '/adapters');

    return new Counter(napp, adapters);
};

function Counter(napp, adapters) {
    this.napp = napp;
    this.adapters = adapters;
    _.forIn(this.adapters, function (adapter) {
        adapter.init(napp);
    })

}

Counter.prototype.onData = function (message) {
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
        settings.ownerId = message.ownerId;
        if (this.adapters[deviceCounter.type] && this.adapters[deviceCounter.type].execute) {
            this.adapters[deviceCounter.type].execute(settings, function (err, result) {
                if (!err) {
                    //TODO send data to the physical device
                }
            });
        }
    });
};

