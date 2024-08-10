var mongoose = require('mongoose');
var Loc = mongoose.model('Location');
// Function to send a JSON response
var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

/* GET list of locations */
module.exports.locationsListByDistance = function(req, res) {
  var lng = parseFloat(req.query.lng);
  var lat = parseFloat(req.query.lat);
  var maxDistance = parseFloat(req.query.maxDistance);

  if ((!lng && lng !== 0) || (!lat && lat !== 0) || !maxDistance) {
    console.log('locationsListByDistance missing params');
    sendJSONresponse(res, 404, {
      "message": "lng, lat and maxDistance query parameters are all required"
    });
    return;
  }

  var point = {
    type: "Point",
    coordinates: [lng, lat]
  };

  var geoOptions = {
    spherical: true,
    distanceField: "dist.calculated",
    maxDistance: maxDistance // Using meters directly
  };

  console.log(`Received lng: ${lng}, lat: ${lat}, maxDistance: ${maxDistance}`);
  console.log(`GeoOptions: ${JSON.stringify(geoOptions)}`);

  Loc.aggregate([
    {
      $geoNear: {
        near: point,
        distanceField: "dist.calculated",
        maxDistance: geoOptions.maxDistance,
        spherical: geoOptions.spherical
      }
    },
    { $limit: 10 }
  ])
    .then(results => {
      console.log(`geoNear results count: ${results.length}`);
      console.log(`GeoNear result: ${JSON.stringify(results, null, 2)}`);
      var locations = buildLocationList(req, res, results);
      sendJSONresponse(res, 200, locations);
    })
    .catch(err => {
      console.log('geoNear error:', err);
      sendJSONresponse(res, 404, err);
    });
};

var buildLocationList = function(req, res, results) {
  var locations = [];
  results.forEach(function(doc) {
    locations.push({
      distance: doc.dist.calculated, // Distance in meters
      name: doc.name,
      address: doc.address,
      rating: doc.rating,
      facilities: doc.facilities,
      _id: doc._id
    });
  });
  return locations;
};

// Handler to read a specific location by ID
module.exports.locationsReadOne = async function(req, res) {
    if (req.params && req.params.locationid) {
        console.log("Received locationid:", req.params.locationid);
        try {
            const location = await Loc.findById(req.params.locationid).exec();
            if (!location) {
                sendJSONresponse(res, 404, {
                    "message": "locationid not found"
                });
                return;
            }
            sendJSONresponse(res, 200, location);
        } catch (err) {
            sendJSONresponse(res, 404, err);
        }
    } else {
        sendJSONresponse(res, 404, {
            "message": "No locationid in request"
        });
    }
};

// Handler to create a new location
module.exports.locationsCreate = async function (req, res) {
    const { name, address, coords } = req.body;

    // Data validation
    if (!name || !address) {
        sendJSONresponse(res, 400, {
            "message": "Name and address are required"
        });
        return;
    }
    try {
        // Check for duplicates by name and address
        let existingLocation = await Loc.findOne({ name: name, address: address });

        if (!existingLocation && coords) {
            // Check for duplicates by coordinates if provided
            existingLocation = await Loc.findOne({ coords: coords });
        }

        if (existingLocation) {
            sendJSONresponse(res, 409, {
                "message": "Location already exists"
            });
            return;
        }

        // Create and save new location
        const location = new Loc({
            name: name,
            address: address,
            coords: coords
            // Add other necessary fields here
        });

        const savedLocation = await location.save();
        sendJSONresponse(res, 201, savedLocation);
    } catch (err) {
        sendJSONresponse(res, 400, err);
    }
};

// Placeholder for update functionality
module.exports.locationsUpdateOne = async function (req, res) {
    if (!req.params.locationid) {
        sendJSONresponse(res, 404, {
            "message" : "Not found, locationid is required"
        });
        return;
    }

    try {
        const location = await Loc.findById(req.params.locationid).exec();

        if (!location){
            sendJSONresponse(res, 404, {
                "message" : "locationid not found"
            });
            return;
        }

        // Fields actuallized with data given in the request
        location.name = req.body.name || location.name;
        location.address = req.body.address || location.address;
        location.facilities = req.body.facilities ? req.body.facilities.split(",") : location.facilities;
        location.location = req.body.location ? {
            type: "Point",
            coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
        } : location.location;
        location.openingTimes = req.body.openingTimes || location.openingTimes;

        // Save changes
        const updatedLocation = await location.save();
        sendJSONresponse(res, 200, updatedLocation);
    } catch (err) {
        sendJSONresponse(res, 400, err);
    }
}

// Handler to delete a specific location by ID
module.exports.locationsDeleteOne = async function (req, res) {
    if (!req.params || !req.params.locationid){
        sendJSONresponse(res, 404, {
            "message": "Not found, locationid is required"
        });
        return;
    }

    try {
        const location = await Loc.findByIdAndDelete(req.params.locationid).exec();
        if (!location) {
            sendJSONresponse(res, 404, {
                "message": "locationid not found"
            });
            return;
        }

        sendJSONresponse(res, 204, null);
    } catch (err) {
        console.error("Error during location deletion:", err);
        sendJSONresponse(res, 400, err);
    }
};
