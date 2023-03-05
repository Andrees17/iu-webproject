const dataModel = require(__dirname + "/dataModel.js");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");
const mongoose = require("mongoose");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//enable use of lodash inside a ejs template
app.locals._ = _;

//Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/workoutsDB");


// GET ROOT
app.get("/", function (req, res) {
    res.send("<h1> Hello World </h1>")
})

app.get("/workouts", function(req, res) {
    res.render("workout");
})

app.get("/:workoutName/exercises", function(req, res) {
    res.send("You have here a list of exercises for this workout")
})

app.get("/:workoutName/:exerciseName/days", function(req, res) {
    res.send("You have here a list of days for this exercise");
})













//LISTEN PORT 3000
app.listen(3000, function () {
    console.log("Server started on port 3000");
});