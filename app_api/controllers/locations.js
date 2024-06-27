var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

module.exports.locationsReadOne = async function(req, res) {
    if (req.params && req.params.locationid) {
        console.log("Received locationid:", req.params.locationid);
        try {
            const location = await Loc.findById(req.params.locationid).exec();
            if (!location) {
                sendJsonResponse(res, 404, {
                    "message": "locationid not found"
                });
                return;
            }
            sendJsonResponse(res, 200, location);
        } catch (err) {
            sendJsonResponse(res, 404, err);
        }
    } else {
        sendJsonResponse(res, 404, {
            "message": "No locationid in request"
        });
    }
};



module.exports.locationsListByDistance = function (req, res){}
module.exports.locationsCreate = function (req, res){}
module.exports.locationsUpdateOne = function (req, res){}
module.exports.locationsDeleteOne = function (req, res){}