const { raw } = require('body-parser');
var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

// Function to send a JSON response
var sendJsonResponse = function(res, status, content){
    res.status(status);
    res.json(content);
}

// Update the average rating of a location
var updateAverageRating = async function(locationid) {
    try {
        const location = await Loc.findById(locationid).select('rating reviews').exec();
        if (location){
            doSetAverageRating(location);
        }
    } catch (err) {
        console.error("Error updating average ratin:", err);
    }
};

// Calculate and set the average rating
var doSetAverageRating = async function(location){
    var  i, reviewCount, ratingAverage, ratingTotal;
    if (location.reviews && location.reviews.length > 0){
        reviewCount = location.reviews.length;
        ratingTotal = 0;
        for (i = 0; i < reviewCount; i++) {
            ratingTotal += location.reviews[i].rating;
        }
        ratingAverage = parseInt(ratingTotal / reviewCount, 10);
        location.rating = ratingAverage;
        try {
            await location.save();
            console.log("Average rating updated to", ratingAverage);
        } catch (err) {
            console.log("Error saving updated rating:", err);
        }
    }
};

// Handler to create a new review
module.exports.reviewsCreate = async function(req, res){ 
    if (req.params.locationid) {
        try {
            const location = await Loc.findById(req.params.locationid).select('reviews').exec();
            if (!location){
                sendJsonResponse(res, 404, {
                    "message" :"locationid not found"
                });
                return;
            }

            location.reviews.push({
                author: req.body.author,
                id: new Date().valueOf(), // Generate a unique ID for the review
                rating: req.body.rating,
                reviewText: req.body.reviewText,
                createdOn: new Date()
            });

            const updatedLocation = await location.save();
            const thisReview = updatedLocation.reviews[updatedLocation.reviews.length -1];

            // Update the average rating
            await updateAverageRating(req.params.locationid);

            sendJsonResponse(res, 201, thisReview);
        } catch (err) {
            sendJsonResponse(res, 400, err);
        }
    } else {
        sendJsonResponse(res, 404, {
            "message" : "Not found, locationid required"
        });
    }

};

// Handler to read a specific review by location ID and review ID
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

module.exports.reviewsDeleteOne = async function(req, res){
    if (!req.params || !req.params.locationid || !req.params.reviewid) {
        sendJsonResponse(res, 404, {
            "message" : "Not found, locationid and reviewid are both required"
        });
        return;
    }
    try {
        const location = await Loc.findById(req.params.locationid).select('reviews').exec();

        if (!location) {
            sendJsonResponse(res, 404, {
                "message":"locationid not found"
            });
            return;
        }
        if (!location.reviews || location.reviews.length === 0) {
            sendJsonResponse(res, 404, {
                "message":"No review to delete"
            });
            return;
        }
        const review = location.reviews.id(req.params.reviewid);
        
        if (!review) {
            sendJsonResponse(res, 404, {
                "message":"reviewid not found"
            });
            return;
        }

        location.reviews.pull({ _id: req.params.reviewid });
        await location.save();

        // Update the average rating
        updateAverageRating(req.params.locationid)

        sendJsonResponse(res, 204, null);
    } catch (err) {
        console.error("Error during review deletion:", err);
        sendJsonResponse(res, 400, err);
    }
};
