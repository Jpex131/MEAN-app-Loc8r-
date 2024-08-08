var request = require('request');

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
            maxDistance : 60 // Fixed maxDistance
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

/* GET 'Add review' page */
module.exports.locationInfo = function(req, res){
    res.render('location-info', {
        title: 'Loc8r - find a place to work with wifi',
        pageHeader: {
            title: 'Loc8r',
            strapline: 'Find places to work with wifi near you!'
        },
        sidebar: "Looking for wifi and a seat? Loc8r helps you find places to work when out and about. Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you're looking for.",
        location: {
            name: 'Starcups',
            address: '125 High Street, Reading, RG6 1PS',
            rating: 4,
            facilities: ['Hot drinks', 'Food', 'Premium wifi'],
            coords: {lat: 51.455041, lng: -0.9690884},
            openingTimes: [{
                days: 'Monday - Friday',
                opening: '7:00am',
                closing: '7:00pm',
                closed: false
            }, {
                days: 'Saturday',
                opening: '8:00am',
                closing: '5:00pm',
                closed: false
            }, {
                days: 'Sunday',
                closed: true
            }],
            reviews: [{
                author: 'Simon Holmes',
                rating: 5,
                createdOn: '16 July 2013',
                reviewText: 'What a great place. I can\'t say enough things about it.'
            }, {
                author: 'Charlie Chaplin',
                rating: 3,
                createdOn: '16 June 2013',
                reviewText: 'It was okay. Coffee wasn\'t great, but the wifi was fast.'
            }]
        }
    });
};

/* GET 'Location info' page */
module.exports.addReview = function(req, res){
    res.render('location-review-form', {
        title: 'Review Starcups on Loc8r',
        pageHeader: {title: 'Review Starcups'} // Fixed typo
    });
};
