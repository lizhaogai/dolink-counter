var querystring = require('querystring');

var log = require('logs').get('dolink:counter:weibo');

var provider = "weibo-link";
var FANS_URL = "https://api.weibo.com/2/users/counts.json";
var FORWARD_URL = "https://api.weibo.com/2/statuses/update.json";
var COMMENTS_URL = "https://api.weibo.com/2/statuses/update.json";

var request = require('request');

module.exports.init = function (napp) {
    log.debug('Start initializing...');
    this.napp = napp;
    log.debug('End initializing...');
};

module.exports.execute = function (ownerId, settings, cb) {
    log.debug('Start access weibo service');
    var self = this;
    var UserCredential = self.napp.model('UserCredential');
    UserCredential.findOne({
        where: {
            userId: ownerId,
            provider: provider
        }
    }, function (err, userCredential) {
        if (err)
            return cb(err);
        if (settings.dataType = "fans") {
            log.debug('Get weibo fans');
            return self.fansCount({
                token: userCredential.credentials.accessToken,
                content: {
                    uids: userCredential.externalId,
                    access_token: userCredential.credentials.accessToken
                }
            }, cb);
        }

    })
}

module.exports.fansCount = function (settings, cb) {

    var postData = querystring.stringify(settings.content);

    return request.get(FANS_URL + "?" + postData, function (err, response) {
        if (err) {
            log.debug("Error get weibo fans count");
            return cb(err);
        }
        if (response && response.statusCode == 200) {
            try {
                var obj = JSON.parse(response.body);
                log.debug('Weibo fans count:', obj[0] && obj[0]['followers_count']);
                cb(null, obj[0] && obj[0]['followers_count'])
            } catch (e) {
                cb(e);
            }

        }
    });
};

module.exports.commentCount = function (settings) {

};

module.exports.forwardCount = function (settings) {

};