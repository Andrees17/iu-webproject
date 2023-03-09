const dataModel = require(__dirname + "/dataModel.js");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");
const mongoose = require("mongoose");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//enable use of lodash inside a ejs template
app.locals._ = _;

//Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/workoutsDB");

// GET ROOT
app.get("/", function (req, res) {
  res.send("<h1> Hello World </h1>");
});

// GET WORKOUTS
app.get("/workouts", function (req, res) {
  const query = dataModel.Workout.find();
  query.then(function (foundWorkouts) {
    res.render("workout", {
      workoutTitle: "workout",
      foundWorkouts: foundWorkouts,
    });
  });
});

// POST WORKOUTS
app.post("/workouts", function (req, res) {
  const workoutName = req.body.workoutName;

  (async () => {
    await insertWorkout(workoutName);
    res.redirect("/workouts");
  })();
});

//DELETE OR UPDATE A WORKOUTS
app.post("/workouts/:workoutID/modify", function (req, res) {
  const workoutID = req.params.workoutID;
  const action = req.body.action;
  const newWorkoutName = req.body.workoutName;

  (async () => {
    if (action === "update") {
      await updateWorkout(workoutID, newWorkoutName);
    } else if (action === "delete") {
      await deleteWorkout(workoutID);
    }
    res.redirect("/workouts");
  })();
});

// GET EXERCISES FROM A WORKOUT
app.get("/:workoutID/exercises", function (req, res) {
  const workoutID = req.params.workoutID;
  (async () => {
    const exercises = await getExercisesFromWorkout(workoutID);
    const workoutName = await getWorkoutNameById(workoutID);
    if (exercises.length > 0) {
      res.render("exercise", {
        workoutID: workoutID,
        workoutName: workoutName,
        exercises: exercises,
      });
    } else {
      res.render("exercise", {
        workoutID: workoutID,
        workoutName: workoutName,
        exercises: [],
      });
    }
  })();
});

// POST AN EXERCISE
app.post("/:workoutID/exercises", function (req, res) {
  const exerciseName = req.body.exerciseName;
  const workoutID = req.params.workoutID;
  (async () => {
    await insertExercise(exerciseName, workoutID);
    res.redirect("/" + workoutID + "/exercises");
  })();
});

//DELETE OR UPDATE AN EXERCISE
app.post("/:workoutID/:exerciseID/modify", function (req, res) {
  const exerciseID = req.params.exerciseID;
  const workoutID = req.params.workoutID;
  const action = req.body.action;
  const newExerciseName = req.body.exerciseName;

  (async () => {
    if (action === "update") {
      await updateExercise(exerciseID, workoutID, newExerciseName);
    } else if (action === "delete") {
      await deleteExercise(exerciseID, workoutID);
    }
    res.redirect("/" + workoutID + "/exercises");
  })();
});

// GET DAYS FROM AN EXERCISE
app.get("/:workoutID/:exerciseID/days", function (req, res) {
  const workoutID = req.params.workoutID;
  const exerciseID = req.params.exerciseID;

  (async () => {
    const days = await getDaysFromExercise(exerciseID);
    const exerciseName = await getExerciseNameById(exerciseID);
    if (days.length > 0) {
      res.render("days", {
        workoutID: workoutID,
        exerciseID: exerciseID,
        exerciseName: exerciseName,
        days: days,
      });
    } else {
      res.render("days", {
        workoutID: workoutID,
        exerciseID: exerciseID,
        exerciseName: exerciseName,
        days: [],
      });
    }
  })();
});

// POST DAYS INTO AN EXERCISE
app.post("/:workoutID/:exerciseID/days", function (req, res) {
  const exerciseID = req.params.exerciseID;
  const workoutID = req.params.workoutID;

  const day = new dataModel.Day({
    date: getDate(req.body.date),
    sets: req.body.sets,
    reps: req.body.reps,
    weight: req.body.weight,
  });

  (async () => {
    await insertDay(workoutID, exerciseID, day);
    res.redirect("/" + workoutID + "/" + exerciseID + "/days");
  })();
});

//DELETE OR UPDATE A DAY
app.post("/:workoutID/:exerciseID/:dayID/modify", function (req, res) {
  const exerciseID = req.params.exerciseID;
  const workoutID = req.params.workoutID;
  const dayID = req.params.dayID;
  const action = req.body.action;

  (async () => {
    if (action === "update") {
      let day = {
        _id: dayID,
        date: getDate(req.body.date),
        sets: req.body.sets,
        reps: req.body.reps,
        weight: req.body.weight,
      };
      await updateDay(workoutID, exerciseID, day);
    } else if (action === "delete") {
      await deleteDay(workoutID, exerciseID, dayID);
    }
    res.redirect("/" + workoutID + "/" + exerciseID + "/days");
  })();
});

// insert a workout object into database
async function insertWorkout(workoutName) {
  const workout = new dataModel.Workout({
    name: workoutName,
  });

  const insertQuery = workout.save();

  await insertQuery
    .then(function () {
      console.log("The workout " + workoutName + " was successfully imported");
    })
    .catch(function (err) {
      console.log("UPS! ERROR:" + err);
    });
}

async function getExercisesFromWorkout(workoutID) {
  const query = dataModel.Workout.findOne({ _id: workoutID });
  const workout = await query;
  return workout.exercises;
}

async function getWorkoutNameById(workoutID) {
  const query = dataModel.Workout.findOne({ _id: workoutID });
  const workout = await query;
  return workout.name;
}

async function insertExercise(exerciseName, workoutID) {
  //Create and insert exercise
  const exercise = new dataModel.Exercise({
    name: exerciseName,
  });
  await exercise.save();

  //Find respective workout and push the just created exercise
  const findQuery = dataModel.Workout.findOne({ _id: workoutID });
  const workout = await findQuery;
  await workout.exercises.push(exercise);
  await workout.save();
}

async function getDaysFromExercise(exerciseID) {
  const query = dataModel.Exercise.findOne({ _id: exerciseID });
  const exercise = await query;
  return exercise.days;
}

async function getExerciseNameById(exerciseID) {
  const query = dataModel.Exercise.findOne({ _id: exerciseID });
  const exercise = await query;
  return exercise.name;
}

async function insertDay(workoutID, exerciseID, day) {
  try {
    console.log("--- Trying to insert day with ID: " + day._id + "---");

    //create day
    await day.save().then(function () {
      console.log("Day was inserted into days collection");
    });

    //update exercise with the day
    const findExerciseQuery = dataModel.Exercise.findOne({ _id: exerciseID });
    const exercise = await findExerciseQuery;
    await exercise.days.push(day);
    await exercise.save().then(function () {
      console.log("Day was pushed into exercises collection");
    });

    //update workout with the day inside the exercise
    await dataModel.Workout.findOneAndUpdate(
      { _id: workoutID, "exercises._id": exerciseID },
      { $push: { "exercises.$.days": day } }
    ).then(function () {
      console.log("Day was updated in workout collection");
    });
  } catch (error) {
    console.log("UPS!!! Error: " + error);
  }
}

async function updateDay(workoutID, exerciseID, day) {
  // Update Day
  await dataModel.Day.updateOne(
    { _id: day._id },
    {
      $set: {
        date: day.date,
        sets: day.sets,
        reps: day.reps,
        weight: day.weight,
      },
    }
  )
    .then(function (response) {
      if (response.modifiedCount > 0 && response.acknowledged) {
        console.log("Day = " + day._id + " was inserted successfully");
      } else {
        throw "WARNING: Update Day Query did not do its job";
      }
    })
    .catch(function (err) {
      console.log("UPS! ERROR:" + err);
    });

  //Update Exercise with new Day
  await dataModel.Exercise.findOneAndUpdate(
    { _id: exerciseID, "days._id": day._id },
    { $set: { "days.$": day } }
  )
    .then(function () {
      console.log("Added in Exercise");
    })
    .catch(function (err) {
      throw err;
    });

  //Update Workout with new Day inside the exercise
  await dataModel.Workout.updateOne(
    {
      _id: workoutID,
      "exercises._id": exerciseID,
    },
    {
      $set: { "exercises.$[exercise].days.$[day]": day },
    },
    {
      arrayFilters: [{ "exercise._id": exerciseID }, { "day._id": day._id }],
    }
  ).then(function () {
    console.log("Added in Workout");
  });
}

async function deleteDay(workoutID, exerciseID, dayID) {
  // delete day
  const deleteDayQuery = dataModel.Day.deleteOne({ _id: dayID });
  await deleteDayQuery
    .then(function (deleteRes) {
      if (deleteRes.deletedCount > 0 && deleteRes.acknowledged) {
        console.log("The day with ID: " + dayID + " has been deleted");
      } else {
        throw "WARNING: Delete Day Query did not do its job";
      }
    })
    .catch(function (err) {
      console.log("UPS! ERROR:" + err);
    });

  // update exercise (remove day from inside)
  const updateExerciseQuery = dataModel.Exercise.updateOne(
    { _id: exerciseID, "days._id": dayID },
    { $pull: { days: { _id: dayID } } }
  );
  await updateExerciseQuery
    .then(function (queryRes) {
      if (queryRes.modifiedCount > 0 && queryRes.acknowledged === true) {
        console.log(
          "The day with ID: " +
            dayID +
            " has been removed from the Exercise with ID: " +
            exerciseID
        );
      } else {
        throw "WARNING: Update Day Query did not do its job";
      }
    })
    .catch(function (err, updateQueryException) {
      console.log("UPS! ERROR: " + err);
    });

  // update workout (remove day from inside)
  const updateWorkoutQuery = dataModel.Workout.updateOne(
    {
      _id: workoutID,
      "exercises._id": exerciseID,
    },
    {
      $pull: { "exercises.$[exercise].days": { _id: dayID } },
    },
    {
      arrayFilters: [{ "exercise._id": exerciseID }],
    }
  );
  await updateWorkoutQuery
    .then(function (queryRes) {
      if (queryRes.modifiedCount > 0 && queryRes.acknowledged === true) {
        console.log(
          "The day with ID: " +
            dayID +
            " has been removed from the Workout with ID: " +
            workoutID
        );
      } else {
        throw "WARNING: Update Workout Query did not do its job";
      }
    })
    .catch(function (err, updateQueryException) {
      console.log("UPS! ERROR: " + err);
    });
}

async function deleteWorkout(workoutID) {
  const deleteQuery = dataModel.Workout.deleteOne({ _id: workoutID });
  await deleteQuery
    .then(function (response) {
      console.log("The workout with ID: " + workoutID + " has been deleted");
    })
    .catch(function (err) {
      console.log("UPS! ERROR:" + err);
    });
}

async function updateWorkout(workoutID, workoutName) {
  const updateQuery = dataModel.Workout.updateOne(
    { _id: workoutID },
    { name: workoutName }
  );
  await updateQuery
    .then(function (response) {
      console.log("The workout with ID: " + workoutID + " has been updated");
    })
    .catch(function (err) {
      console.log("UPS! ERROR:" + err);
    });
}

async function deleteExercise(exerciseID, workoutID) {
  // delete exercise
  const deleteQuery = dataModel.Exercise.deleteOne({ _id: exerciseID });
  await deleteQuery
    .then(function (response) {
      if (response.deletedCount > 0 && response.acknowledged) {
        console.log(
          "The exercise with ID: " + exerciseID + " has been deleted"
        );
      } else {
        throw "WARNING: Delete Query did not do its job";
      }
    })
    .catch(function (err) {
      console.log("UPS! ERROR:" + err);
    });

  // update workout (remove exercise from inside)
  const updateQuery = dataModel.Workout.updateOne(
    { _id: workoutID },
    { $pull: { exercises: { _id: exerciseID } } }
  );
  await updateQuery
    .then(function (response) {
      if (response.modifiedCount > 0 && response.acknowledged === true) {
        console.log(
          "The exercise with ID: " +
            exerciseID +
            " has been removed from the Workout with ID: " +
            workoutID
        );
      } else {
        throw "WARNING: Update Query did not do its job";
      }
    })
    .catch(function (err, updateQueryException) {
      console.log("UPS! ERROR: " + err);
    });
}

async function updateExercise(exerciseID, workoutID, newName) {
  // update exercise
  const updateExerciseQuery = dataModel.Exercise.updateOne(
    { _id: exerciseID },
    { name: newName }
  );
  await updateExerciseQuery
    .then(function (response) {
      if (response.modifiedCount > 0 && response.acknowledged) {
        console.log(
          "The exercise with ID: " +
            exerciseID +
            " has been updated with the new name"
        );
      } else {
        throw "WARNING: Update Exercise Query did not do its job";
      }
    })
    .catch(function (err) {
      console.log("UPS! ERROR:" + err);
    });

  // update workout (update exercise name inside of it)
  const updateQuery = dataModel.Workout.findOneAndUpdate(
    { _id: workoutID, "exercises._id": exerciseID },
    { $set: { "exercises.$.name": newName } }
  );
  await updateQuery
    .then(function (response) {
      if (response.modifiedCount > 0 && response.acknowledged) {
        console.log(
          "The exercise with ID: " +
            exerciseID +
            " has been updated with a new name from the Workout with ID: " +
            workoutID
        );
      } else {
        throw "WARNING: Update Query did not do its job";
      }
    })
    .catch(function (err, updateQueryException) {
      console.log("UPS! ERROR: " + err);
    });
}

function getDate(date) {
  const day = new Date(date);
  const options = { year: "numeric", month: "numeric", day: "numeric" };
  return day.toLocaleDateString("en-GB", options);
}

//LISTEN PORT 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
