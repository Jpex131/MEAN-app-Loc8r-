var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var sendJsonResponse = function(res, status, content){
    res.status(status);
    res.json(content);
}

module.exports.reviewsCreate = function(req, res){};
module.exports.reviewsReadOne = function(req, res){};
module.exports.reviewsDeleteOne = function(req, res){};


