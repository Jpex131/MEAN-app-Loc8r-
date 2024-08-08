var mongoose = require('mongoose');

var openingTimeSchema = new mongoose.Schema({
    days: { type: String, required: true },
    opening: String,
    closing: String,
    closed: { type: Boolean, required: true }
});

var reviewSchema = new mongoose.Schema({
    author: String,
    id: { type: Number, required: true }, 
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviewText: String,
    createdOn: { type: Date, "default": Date.now }
});

var locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: String,
    rating: { type: Number, default: 0, min: 0, max: 5 },
    facilities: [String],
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    },
    openingTimes: [openingTimeSchema],
    reviews: [reviewSchema]
});

// Create a single 2dsphere index for the `location` field
locationSchema.index({ location: '2dsphere' })

mongoose.model('Location', locationSchema);
