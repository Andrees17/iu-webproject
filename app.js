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

// GET WORKOUTS
app.get("/workouts", function(req, res) {
    const query = dataModel.Workout.find();
    query.then(function(foundWorkouts){
    res.render("workout", {workoutTitle: "workout", foundWorkouts:foundWorkouts});
    });
})

// POST WORKOUTS
app.post("/workouts", function(req, res) {
    const workoutName = req.body.workoutName;
    insertWorkout(workoutName);
    res.redirect("/workouts")
})

// GET EXERCISES FROM A WORKOUT
app.get("/:workoutID/exercises", function(req, res) {
    const workoutID = req.params.workoutID;

    (async () => {
        const exercises = await getExercisesFromWorkout(workoutID);
        const workoutName = await getWorkoutNameById(workoutID);
        if(exercises.length > 0){
            res.render("exercise", {workoutID:workoutID, workoutName:workoutName, exercises:exercises});

        } else {
            res.render("exercise", {workoutID:workoutID, workoutName:workoutName, exercises:[]});
        }
    })();
})

// POST AN EXERCISE
app.post("/:workoutID/exercises", function(req, res) {
    const exerciseName = req.body.exerciseName;
    const workoutID = req.params.workoutID;
    (async () => {
        insertExercise(exerciseName, workoutID);
        res.redirect("/"+workoutID+"/exercises");
    })();
})

app.get("/:workoutName/:exerciseName/days", function(req, res) {
    res.send("You have here a list of days for this exercise");
})


// insert a workout object into database
async function insertWorkout(workoutName){

    const workout = new dataModel.Workout({
        name: workoutName
    });

    const insertQuery = workout.save();

    await insertQuery.then(
        function(){
            console.log("The workout " + workoutName + " was successfully imported")
        }).catch(function(err){
            console.log("UPS! ERROR:" + err);
        });
}

async function getExercisesFromWorkout(workoutID){

    const query = dataModel.Workout.findOne({_id:workoutID});
    const workout = await query;
    return workout.exercises;
    
/*     query.then(function(workout){
        let exercises = workout.exercises;
        return exercises;
    }).catch(function(error){
        console.log("ups" + err)
    }); */

}

async function getWorkoutNameById(workoutID){
    const query = dataModel.Workout.findOne({_id:workoutID});
    const workout = await query;
    return workout.name;
}

async function insertExercise(exerciseName, workoutID){

    const exercise = new dataModel.Exercise({
        name: exerciseName
    });

    const findQuery = dataModel.Workout.findOne({_id:workoutID});
    const workout = await findQuery;
    await workout.exercises.push(exercise);
    await workout.save()

}











//LISTEN PORT 3000
app.listen(3000, function () {
    console.log("Server started on port 3000");
});