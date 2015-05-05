var iweibo = require('iweibo');
var querystring = require('querystring');

var provider = "weibo-link";
var FANS_URL = "https://api.weibo.com/2/users/counts.json";
var FORWARD_URL = "https://api.weibo.com/2/statuses/update.json";
var COMMENTS_URL = "https://api.weibo.com/2/statuses/update.json";

var request = require('request');

module.exports.init = function (napp) {
    this.napp = napp;
    iweibo.set(napp.get('weibo'));
};

module.exports.execute = function (ownerId, settings, cb) {
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
    //var weibo = new iweibo.Weibo(settings.token, null);

    var postData = querystring.stringify(settings.content);

    return request.get(FANS_URL + "?" + postData, function (err, response) {
        if (err) {
            return cb(err);
        }
        if (response && response.statusCode == 200) {
            try {
                var obj = JSON.parse(response.body)
                cb(null, obj[0] && obj[0]['followers_count'])
            } catch (e) {
                cb(e);
            }

        }
    });
    //var postHeader = {
    //    'Content-Type': 'application/x-www-form-urlencoded'
    //};
    //return weibo.request('GET', FANS_URL, postHeader, postData, settings.token, function (err, obj) {
    //    if (err) {
    //        console.log(err);
    //    }
    //    if (obj) {
    //        cb(null, obj['followers_count']);
    //    }
    //});
};

module.exports.commentCount = function (settings) {

};

module.exports.forwardCount = function (settings) {

};