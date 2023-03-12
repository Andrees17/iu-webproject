const mongoose = require("mongoose");
// Connect to the workouts database
const workoutsDB = mongoose.createConnection(
  "mongodb://127.0.0.1:27017/workoutsDB"
);

// Connect to the  users database
const usersDB = mongoose.createConnection("mongodb://127.0.0.1:27017/usersDB");

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

module.exports.Workout = workoutsDB.model("Workout", workoutSchema);
module.exports.Exercise = workoutsDB.model("Exercise", exerciseSchema);
module.exports.Day = workoutsDB.model("Day", daySchema);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
});

module.exports.User = usersDB.model("User", userSchema);
