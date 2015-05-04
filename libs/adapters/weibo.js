var iweibo = require('iweibo');
var querystring = require('querystring');

var provider = "weibo-link";
var FANS_URL = "https://api.weibo.com/2/users/counts.json";
var FORWARD_URL = "https://api.weibo.com/2/statuses/update.json";
var COMMENTS_URL = "https://api.weibo.com/2/statuses/update.json";

module.exports.init = function (napp) {
    this.napp = napp;
    this.UserCredential = napp.model('UserCredential');
    iweibo.set(app.get('weibo'));
};

module.exports.execute = function (settings, cb) {
    var self = this;
    self.UserCredential.findOne({
        where: {
            userId: settings.ownerId,
            provider: provider
        }
    }, function (err, userCredential) {
        if (err)
            return cb(err);
        if (settings.dataType = "fans") {
            return self.fansCount({token: userCredential.credentials.accessToken, content: {}}, cb);
        }

    });
};

module.exports.fansCount = function (settings, cb) {
    var content = encodeURIComponent(settings.content);
    var weibo = new iweibo.Weibo(settings.token, null);

    var postData = querystring.stringify(content);
    var postHeader = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    return weibo.request('GET', FANS_URL, postHeader, postData, settings.token, function (err, obj) {
        if (err) {
            console.log(obj);
        }
        cb(null, obj['followers_count']);
    });
};

module.exports.commentCount = function (settings) {

};

module.exports.forwardCount = function (settings) {

};