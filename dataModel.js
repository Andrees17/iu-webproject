// Import Mongoose Module
const mongoose = require("mongoose");

// Connect to workoutsDB
const workoutsDB = mongoose.createConnection(
  "mongodb://127.0.0.1:27017/workoutsDB"
);
// Connect to usersDB
const usersDB = mongoose.createConnection("mongodb://127.0.0.1:27017/usersDB");

/**
 * * Create schemas for day, exercise, workouts
 * * These schemas are for the workoutsDB
 */
const daySchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  sets: {
    type: Number,
    required: true,
  },
  reps: {
    type: String,
    required: true,
  },
  weight: {
    type: String,
    required: true,
  },
});

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  days: [daySchema],
});

const workoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  exercises: [exerciseSchema],
  _userId: {
    type: String,
    required: true,
  },
});

/**
 * * Create schemas user
 * * This schema is for the usersDB
 */

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

// * Link each Schema to a model in its respective DB and export it as a module
module.exports.Workout = workoutsDB.model("Workout", workoutSchema);
module.exports.Exercise = workoutsDB.model("Exercise", exerciseSchema);
module.exports.Day = workoutsDB.model("Day", daySchema);
module.exports.User = usersDB.model("User", userSchema);
