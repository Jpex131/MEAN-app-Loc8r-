var mongoose = require('mongoose');
var gracefulShutdown;
var dbURI = 'mongodb://Jpex117:Gogeta201@localhost:27017/Loc8r?authSource=admin';


mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', function(){
    console.log('Mongoose connected to ' + dbURI);
});
mongoose.connection.on('error', function(err){
    console.log('Mongoose connection error: ' + err);
});
mongoose.connection.on('disconnected', function(){
    console.log('Mongoose disconnected');
});

gracefulShutdown = function(msg, callback) {
    mongoose.connection.close(function(){
        console.log('Mongoose disconnected through ' + msg);
        callback();
    });
};

// For nodemon restarts
process.once('SIGUSR2', function(){
    gracefulShutdown('nodemon restart', function(){
        process.kill(process.pid, 'SIGUSR2');
    });
});

// For app termination
process.on('SIGINT', function(){
    gracefulShutdown('app termination', function(){
        process.exit(0);
    });
});

// For Heroku app termination
process.on('SIGTERM', function(){
    gracefulShutdown('Heroku app termination', function(){
        process.exit(0);
    });
});

require('./locations'); // Asegúrate de requerir el archivo locations.js
