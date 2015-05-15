"use strict";

var requireAll = require('require-all');
var _ = require('lodash');
var log = require('logs').get('dolink:counter');
var weixin = require('weixin-api');
weixin.token = require("./token.json").token;

exports.init = function (napp) {
    var adapters = requireAll(__dirname + '/adapters');
    // other static resources
    napp.app.use(napp.app.express.static(__dirname + '/..' + '/public', {maxAge: 0}));

    napp.app.get('/dc/weixin', function (req, res) {
        if (weixin.checkSignature(req)) {
            res.send(200, req.query.echostr);
        } else {
            res.send(200, 'fail');
        }
    });

    // Start
    napp.app.post('/dc/weixin', function (req, res) {
        weixin.loop(req, res);
    });
    listen(weixin);

    return new Counter(napp, adapters);
};

function listen(weixin) {

    weixin.textMsg(function (msg) {
        console.log("textMsg received");
        console.log(JSON.stringify(msg));
        var resMsg = {};

        switch (msg.content) {
            case "文本" :
                // 返回文本消息
                resMsg = {
                    fromUserName: msg.toUserName,
                    toUserName: msg.fromUserName,
                    msgType: "text",
                    content: "这是文本回复",
                    funcFlag: 0
                };
                break;

            case "音乐" :
                // 返回音乐消息
                resMsg = {
                    fromUserName: msg.toUserName,
                    toUserName: msg.fromUserName,
                    msgType: "music",
                    title: "音乐标题",
                    description: "音乐描述",
                    musicUrl: "音乐url",
                    HQMusicUrl: "高质量音乐url",
                    funcFlag: 0
                };
                break;

            case "图文" :

                var articles = [];
                articles[0] = {
                    title: "PHP依赖管理工具Composer入门",
                    description: "PHP依赖管理工具Composer入门",
                    picUrl: "http://weizhifeng.net/images/tech/composer.png",
                    url: "http://weizhifeng.net/manage-php-dependency-with-composer.html"
                };

                articles[1] = {
                    title: "八月西湖",
                    description: "八月西湖",
                    picUrl: "http://weizhifeng.net/images/poem/bayuexihu.jpg",
                    url: "http://weizhifeng.net/bayuexihu.html"
                };

                articles[2] = {
                    title: "「翻译」Redis协议",
                    description: "「翻译」Redis协议",
                    picUrl: "http://weizhifeng.net/images/tech/redis.png",
                    url: "http://weizhifeng.net/redis-protocol.html"
                };

                // 返回图文消息
                resMsg = {
                    fromUserName: msg.toUserName,
                    toUserName: msg.fromUserName,
                    msgType: "news",
                    articles: articles,
                    funcFlag: 0
                }
        }

        weixin.sendMsg(resMsg);
    });

// 监听图片消息
    weixin.imageMsg(function (msg) {
        console.log("imageMsg received");
        console.log(JSON.stringify(msg));
    });

// 监听位置消息
    weixin.locationMsg(function (msg) {
        console.log("locationMsg received");
        console.log(JSON.stringify(msg));
    });

// 监听链接消息
    weixin.urlMsg(function (msg) {
        console.log("urlMsg received");
        console.log(JSON.stringify(msg));
    });

// 监听事件消息
    weixin.eventMsg(function (msg) {
        console.log("eventMsg received");
        console.log(JSON.stringify(msg));
    });
}

function Counter(napp, adapters) {
    log.debug('Start initialize...');
    var self = this;
    this.napp = napp;
    this.adapters = adapters;
    _.forIn(this.adapters, function (adapter) {
        adapter.init(napp);
    });

    var channel = napp.bus.subscribe('$device/:did/channel/:cid/event/:eventName');
    channel.on('data', function (message, router) {
        self.onData(router.params.did, router.params.cid, message);

    });
    log.debug('End initialize...');
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

        log.debug('Find device counter settings for', deviceId);
        if ((new Date()) - deviceCounter.lastUpdate < deviceCounter.ttl * 1000) {
            log.debug('Device not time out, finish');
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

