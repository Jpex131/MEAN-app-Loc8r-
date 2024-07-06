const { raw } = require('body-parser');
var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var sendJsonResponse = function(res, status, content){
    res.status(status);
    res.json(content);
}

module.exports.reviewsCreate = function(req, res){};

module.exports.reviewsReadOne = async function(req, res){
    console.log("Getting single review");
    if(req.params && req.params.locationid && req.params.reviewid){
        try{
            const location = await Loc.findById(req.params.locationid).select("name reviews").exec();
            console.log(location);
            if (!location){
                sendJsonResponse(res, 404, {
                    "message" : "Location ID not found"
                });
                return;
            }
            if (location.reviews && location.reviews.length > 0) {
                const reviewid = parseInt(req.params.reviewid, 10);
                review = location.reviews.find(r => r.id === reviewid);                
                if (!review){
                    sendJsonResponse(res, 404, {
                        "message" : "reviewid not found"
                    });
                } else {
                    const response = {
                        name: location.name,
                        id: req.params.locationid,
                        review: review
                    };
                    sendJsonResponse(res, 200, response);
                }
            } else {
                sendJsonResponse(res, 404, {
                    "message": "No reviews found"
                });
            }
        } catch (err) {
            sendJsonResponse(res, 400, err);
        }
    } else {
        sendJsonResponse(res, 404, {
            "message" : " Not found, locationid and reviewid are both required"
        })
    }
};

module.exports.reviewsDeleteOne = function(req, res){};
