const mongoose = require("mongoose");

const daySchema = new mongoose.Schema({
    date: {
        type: Date
        //required: true
    },
    sets: {
        type: Number,
        required: true
    },
    reps: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    }
});

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    days: [daySchema]
});

const workoutSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    exercises: [exerciseSchema]
});

module.exports.Workout = mongoose.model("Workout", workoutSchema);
module.exports.Exercise = mongoose.model("Exercise", exerciseSchema);
module.exports.Day = mongoose.model("Day", daySchema);
