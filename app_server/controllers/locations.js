var request = require('request');

var _isNumeric = function(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
};

var _formatDistance = function (distance){
    var numDistance, unit;
    if (distance && _isNumeric(distance)){
        if (distance > 1) {
            numDistance = parseFloat(distance).toFixed(1);
            unit = 'km';
        } else {
            numDistance = parseInt(distance * 1000, 10);
            unit = 'm';
        }
        return numDistance + unit;
    } else {
        return "?";
    }
};
var _showError = function(req, res, status){
    var title, content;
    if (status === 404){
        title = "404, page not found";
        content = "WoW looks like we can't find this page. Sorry";
    } else if (status == 500){
        title = "500, internal server error";
        content = "Something went wrong on our side. Please try again later.";
    } else {
        title = status + ", something fone wrong";
        content = "Something, Somewhere, has gone just a little bit wrong.";
    }
    res.status(status);
    res.render('generic-text', {
        title: title,
        content: content
    });
};

var renderHomepage = function(req, res, responseBody){
    var message;
    if (!(responseBody instanceof Array)){
        message = "API lookup error"; // Fixed typo
        responseBody = [];
    } else {
        if (!responseBody.length){
            message = "No places found nearby";
        }
    }
    res.render('locations-list', {
        title: 'Loc8r - find a place to work with wifi',
        pageHeader: {
            title: 'Loc8r',
            strapline: 'Find places to work with wifi near you!'
        },
        sidebar: "Looking for wifi and a seat? Loc8r helps you find places to work when out and about. Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you're looking for.",
        locations: responseBody,
        message: message
    });
};

var apiOptions = {
    server: "http://localhost:3000"
};

/* GET 'home' page */
module.exports.homelist = function(req, res){
    var requestOptions, path;
    path = '/api/locations';
    requestOptions = {
        url : apiOptions.server + path,
        method : "GET",
        json : {},
        qs : {
            lng : -74.0062,
            lat : 40.7123,
            maxDistance : 600000000 // Fixed maxDistance
        }
    };
    request(
        requestOptions,
        function(err, response, body) {
            var i, data;
            if (err){
                console.error("Error in API request:", err);
            } else if (response && response.statusCode == 200){
                data = body;
                if (data.length) {
                    for (i=0; i<data.length; i++){
                        data[i].distance = _formatDistance(data[i].distance);
                    }
                }
                renderHomepage(req, res, data);
            } else {
                console.error("Unexpected response:", response);
                renderHomepage(req, res, []);
            }
        }
    );
};

var renderDetailPage = function (req, res, locDetail) {
    res.render('location-info', {
        title: locDetail.name,
        pageHeader: {title: locDetail.name},
        sidebar: {
            context: "is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done",
            callToAction: "if you \'ve been and you like it - or if you don\'t - please leve a review to help other people just like you." 
        },
        location: locDetail
    });
};

/* GET 'Location info' page */
module.exports.locationInfo = function(req, res){
    var requestOptions, path;
    path = "/api/locations/" + req.params.locationid;

    requestOptions = {
        url : apiOptions.server + path,
        method : "GET",
        json : {}
    };
    request(
        requestOptions,
        function(err, response, body){
            if (response.statusCode === 200 && body){
                var data = body;
                if ( body.coords && body.coords.length === 2){
                    data.coords = {
                        lng : body.coords[0],
                        lat : body.coords[1]
                    };
                } else {
                    data.coords = {
                        lng: 0,
                        lat: 0
                    };
                    console.warn("Coordinates not found in the response body. Defaulting to (0,0).");
                }
                renderDetailPage(req, res, data);
            } else {
                console.error("Error in locationInfo request:", err || `Status code: ${response.statusCode}`);
                _showError(req, res, response.statusCode);
            }
        }
    );
};

/* GET 'Add review' page */
module.exports.addReview = function(req, res){
    var requestOptions, path;
    path = "/api/locations/" + req.params.locationid;

    requestOptions = {
        url : apiOptions.server + path,
        method : "GET",
        json : {}
    };

    request(
        requestOptions,
        function(err, response, body){
            if (response.statusCode === 200 && body){
                var data = body;
                if ( body.coords && body.coords.length === 2){
                    data.coords = {
                        lng : body.coords[0],
                        lat : body.coords[1]
                    };
                } else {
                    data.coords = {
                        lng: 0,
                        lat: 0
                    };
                    console.warn("Coordinates not found in the response body. Defaulting to (0,0).");
                }
                res.render('location-review-form', {
                    title: `Review ${data.name} on Loc8r`,
                    pageHeader: {title: `Review ${data.name}`},
                    location: data
                });
            } else {
                console.error("Error in addReview request:", err || `Status code: ${response.statusCode}`);
                res.status(response.statusCode).json({"message" : "Location not found"});
            }
        }
    );
};


module.exports.doAddReview = function(req, res){
    var requestOptions, path, postData;
    var locationid = req.params.locationid;
    path = `/api/locations/` + locationid + `/reviews`;
    postData = {
        author: req.body.name,
        rating: parseInt(req.body.rating, 10),
        reviewText: req.body.review
    };
    requestOptions = {
        url: apiOptions.server + path,
        method: "POST",
        json: postData
    };
    request(
        requestOptions,
        function(err, response, body){
            if (err) {
                console.error('Error while adding review:', err);
                res.status(500).json(err);
            } else if (response.statusCode === 201){
                res.redirect('/location/' + locationid);
            } else {
                // Error handling
                res.status(response.statusCode);
            }
        }
    );
};