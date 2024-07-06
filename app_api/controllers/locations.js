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
module.exports.locationsCreate = async function (req, res){
    const {name, address, coords} = req.body;

    // Validation de datos
    if (!name || !address) {
        sendJsonResponse(res, 400, {
            "Message" : "Name and address are required"        
        });
        return;
    }
    try {
        // Comprobar duplicados por nombre y direccion
        let existingLocation = await Loc.findOne({name: name, address: address});

        if (!existingLocation && coords) {
            // Comprobar duplicados por coordenadas si se proporcionan
            existingLocation = await Loc.findOne({ coords: coords});
        }
        if (existingLocation) {
            sendJsonResponse(res, 409, {
                "Message" : "Location already exist"
            });
            return;
        }
        // Crear y guardar nueva ubicacion
        const location = new Loc({
            name: name,
            address: address,
            coords: coords
            /* Anadir otos campos necesarios aqui */
        });

        const savedLocation = await location.save();
        sendJsonResponse(res, 201, savedLocation);
    } catch(err) {
        sendJsonResponse(res, 400, err);
    }
}
module.exports.locationsUpdateOne = function (req, res){}
module.exports.locationsDeleteOne = function (req, res){}