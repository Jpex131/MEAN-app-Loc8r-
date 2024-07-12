var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var sendJsonResponse = function(res, status, content) {
    res.status(status);
    res.json(content);
};

var theEarth = (function () {
    var earthRadius = 6371; //km, miles is 3959

    var getDistanceFromRads = function(rads) {
        return parseFloat(rads * earthRadius);
    };

    var getRadsFromDistance = function(distance) {
        return parseFloat(distance / earthRadius);
    };

    return {
        getDistanceFromRads: getDistanceFromRads,
        getRadsFromDistance: getRadsFromDistance
    };
})();

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

module.exports.locationsListByDistance = async function (req, res) {
    var lng = parseFloat(req.query.lng);
    var lat = parseFloat(req.query.lat);
    var maxDistance = parseFloat(req.query.maxDistance) || 20; // Default to 20 km if not provided
    console.log(`Received lng: ${lng}, lat: ${lat}, maxDistance: ${maxDistance}`);

    if (isNaN(lng) || isNaN(lat)) {
        sendJsonResponse(res, 404, {
            "message": "lng and lat query parameters are required and must be numbers"
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
        maxDistance: theEarth.getRadsFromDistance(maxDistance) // Convierte km a metros
    };
    
    
    console.log("GeoOptions for query:", geoOptions);

    try {
        const results = await Loc.aggregate([
            {
                $geoNear: {
                    near: point,
                    ...geoOptions
                }
            },
            { $limit: 10 }
        ]);
        console.log(`geoNear results count: ${results.length}`);
        console.log(`GeoNear result: ${JSON.stringify(results, null, 2)}`)

        if (results.length === 0) {
            sendJsonResponse(res, 404, {
                "message" : "No locations found nearby"
            });
            return;
        }
        const locations = results.map(doc => ({
            distance: theEarth.getDistanceFromRads(doc.dist.calculated),
            name: doc.name,
            address: doc.address,
            rating: doc.rating,
            facilities: doc.facilities,
            _id: doc._id
        }));

        sendJsonResponse(res, 200, locations);
    } catch (err) {
        console.error("Enrror during geoNear aggregation:", err)
        sendJsonResponse(res, 404, err);
    }
};

module.exports.locationsCreate = async function (req, res) {
    const { name, address, coords } = req.body;

    // Validación de datos
    if (!name || !address) {
        sendJsonResponse(res, 400, {
            "message": "Name and address are required"
        });
        return;
    }
    try {
        // Comprobar duplicados por nombre y dirección
        let existingLocation = await Loc.findOne({ name: name, address: address });

        if (!existingLocation && coords) {
            // Comprobar duplicados por coordenadas si se proporcionan
            existingLocation = await Loc.findOne({ coords: coords });
        }

        if (existingLocation) {
            sendJsonResponse(res, 409, {
                "message": "Location already exists"
            });
            return;
        }

        // Crear y guardar nueva ubicación
        const location = new Loc({
            name: name,
            address: address,
            coords: coords
            // Añade otros campos necesarios aquí
        });

        const savedLocation = await location.save();
        sendJsonResponse(res, 201, savedLocation);
    } catch (err) {
        sendJsonResponse(res, 400, err);
    }
};

module.exports.locationsUpdateOne = function (req, res) {}

module.exports.locationsDeleteOne = async function (req, res) {
    if (!req.params || !req.params.locationid){
        sendJsonResponse(res, 404, {
            "mesage":"Not dfound, locationid is required"
        });
        return;
    }

    try{
        const location = await Loc.findByIdAndDelete(req.params.locationid).exec();
        if(!location){
            sendJsonResponse(res, 404, {
                "message": "locationid not found"
            });
            return;
        }

        sendJsonResponse(res,204, null);
    } catch (err) {
        console.error("Error during location deletion:", err);
        sendJsonResponse(res, 400, err);
    }
};
