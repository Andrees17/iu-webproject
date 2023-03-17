// Import - Load necessary modules of the app
const dataModel = require(__dirname + "/dataModel.js");
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
const uuid = require("uuid"); //uui generates a random version 4 UUID (Universally Unique Identifier)

const app = express(); // creates an instance of the express web framework
app.set("view engine", "ejs"); // sets the view engine for the app to EJS templating engine
app.use(bodyParser.urlencoded({ extended: true })); // adds middleware that parses incoming request bodies in the urlencoded format
app.use(bodyParser.json()); // same as above but for request bodies in the JSON format
app.use(express.static("public")); // serves static files from the "public" dir
app.locals._ = _; // sets a global var "_" in the app's local variables, that can be accessed in views and templates

app.use(
  session({
    secret: uuid.v4(), //sets a secret key for the session using the uuid.v4()
    resave: false, //the session should not be saved on every request
    saveUninitialized: true, //Af new session should be created for each new client that connects to the server
    cookie: { secure: false }, // set to true if using HTTPS
  })
);

// * Adds a middleware function
app.use((req, res, next) => {
  //arrow function expression
  if (["/", "/login", "/signup"].includes(req.path)) {
    //if login, signup routes are included in req.path
    return isAuthenticated(req, res, next); //then, check if user isAuthenticated
  }
  return requireAuth(req, res, next); //otherwise, everyother route requires auth
});

// * ROUTE HTTP GET FOR "/"
app.get("/", function (req, res) {
  res.redirect("/login"); //redirect traffic to /login
});

// * ROUTE HTTP GET FOR LOGIN "/login"
app.get("/login", isAuthenticated, function (req, res) {
  res.render("login");
});

// * ROUTE HTTP POST FOR LOGIN "/login"
app.post("/login", function (req, res) {
  const userLogin = {
    email: req.body.email.toLowerCase(),
    password: req.body.password,
  };

  dataModel.User.findOne({ email: userLogin.email })
    .then(function (attemptingUser) {
      let message = "";
      if (attemptingUser) {
        if (attemptingUser.password === userLogin.password) {
          req.session.userId = attemptingUser._id.toString();
          res.cookie("loggedIn");
          console.log(
            "The User -> " + userLogin.email + " was successfully logged in"
          );
          return res.redirect("/workouts");
        } else {
          console.log("The User password is incorrect");
          message = "alert-password";
          res.render("login", { message: message });
        }
      } else {
        console.log("The Email does not exist");
        message = "alert-email";
        res.render("login", { message: message });
      }
    })
    .catch(function (err) {
      console.log(
        "UPS! Something happen during login of " +
          userLogin.email +
          " -> " +
          err
      );
    });
});

// * ROUTE HTTP GET FOR "/signup"
app.get("/signup", isAuthenticated, function (req, res) {
  res.render("signup");
});

// * ROUTE HTTP POST FOR "/signup"
app.post("/signup", function (req, res) {
  const newUserInput = {
    email: req.body.email.toLowerCase(), //get email from the form and lowercase it
    password: req.body.password, //get password from the form
  };

  //Check if given email already exists,
  dataModel.User.findOne({ email: newUserInput.email }).then(function (
    userExist
  ) {
    let message = "";
    //If the callback function returns a promise, it means that the user already exists
    if (userExist) {
      console.log("The User ->" + newUserInput.email + " already exists");
      message = "already-exists";
      return res.render("signup", { message: message }); //return to the signup page, with a message that the user already exists
    }
    //If User does not exist, then create a new one
    const newUser = new dataModel.User({
      email: newUserInput.email,
      password: newUserInput.password,
    });

    (async () => {
      //immediately invoked function expression (IIFE)
      const insertQuery = newUser.save(); //insert it into the database
      await insertQuery //pause execution until the promise is resolved
        .then(function () {
          //if it returns a promise, it means that the insert was successful
          console.log(
            "The User -> " + newUserInput.email + " was successfully registered"
          );
          message = "signup-successful";
          return res.render("login", { message: message }); //Render now the login page after signup
        })
        .catch(function (err) {
          //if an error occurs, it means that the insert failed
          console.log("UPS! ERROR:" + err);
        });
    })();
  });
});

// * ROUTE HTTP POST FOR "/logout"
app.post("/logout", function (req, res) {
  req.session.destroy(function (err) {
    //destroy the session when user logs out
    if (err) {
      console.log(err);
    } else {
      res.clearCookie("loggedIn", true); //removes the loggedIn cookie
      res.redirect("/login");
    }
  });
});

// * ROUTE HTTP GET FOR "/workouts"
app.get("/workouts", function (req, res) {
  const query = dataModel.Workout.find({ _userId: req.session.userId }); //Get all workouts for the user
  query.then(function (foundWorkouts) {
    res.render("workout", {
      //render workout page
      workoutTitle: "workout", //properties passed to the EJS view
      foundWorkouts: foundWorkouts,
    });
  });
});

// * ROUTE HTTP POST FOR "/workouts"
app.post("/workouts", function (req, res) {
  const workoutName = req.body.workoutName; //get new Workout Name
  (async () => {
    //IIFE
    await insertWorkout(workoutName, req.session.userId); //Insert it to db
    res.redirect("/workouts");
  })();
});

// * ROUTE HTTP POST FOR DELETE OR UPDATE A WORKOUT
app.post("/workouts/:workoutID/modify", function (req, res) {
  const workoutID = req.params.workoutID;
  const action = req.body.action;
  const newWorkoutName = req.body.workoutName; //New name of the workout to be modified

  (async () => {
    //IIFE
    if (action === "update") {
      //if chosen action in the dropdown menu is edit then
      await updateWorkout(workoutID, newWorkoutName);
    } else if (action === "delete") {
      //if chosen action in the dropdown menu is delete then
      await deleteWorkout(workoutID);
    }
    res.redirect("/workouts"); //either way redirect to workouts
  })();
});

// * ROUTE HTTP GET FOR EXERCISES
app.get("/:workoutID/exercises", function (req, res) {
  const workoutID = req.params.workoutID;
  (async () => {
    //IIFE
    const exercises = await getExercisesFromWorkout(workoutID); //Get all the exercises from a workout
    const workoutName = await getWorkoutNameById(workoutID);
    if (exercises.length > 0) {
      //if workout has an exercise array then
      res.render("exercise", {
        //render the exercise.ejs and properties are passed
        workoutID: workoutID,
        workoutName: workoutName,
        exercises: exercises, //contains array of all exercises
      });
    } else {
      res.render("exercise", {
        //It doesnt contain
        workoutID: workoutID,
        workoutName: workoutName,
        exercises: [],
      });
    }
  })();
});

// * ROUTE HTTP POST FOR EXERCISES
app.post("/:workoutID/exercises", function (req, res) {
  const exerciseName = req.body.exerciseName; //new name of the exercise to be inserted
  const workoutID = req.params.workoutID; //workoutID of the workout where exercise will be inserted
  (async () => {
    //IIFE
    await insertExercise(exerciseName, workoutID); //insert operation
    res.redirect("/" + workoutID + "/exercises");
  })();
});

// * ROUTE HTTP POST TO DELETE OR UPDATE AN EXERCISE
app.post("/:workoutID/:exerciseID/modify", function (req, res) {
  const exerciseID = req.params.exerciseID; //id to update exercise
  const workoutID = req.params.workoutID; //id to update workout
  const action = req.body.action; //either edit or delete
  const newExerciseName = req.body.exerciseName; //new name of excersise to be edited

  (async () => {
    //IIFE
    if (action === "update") {
      //If user chose edit then
      await updateExercise(exerciseID, workoutID, newExerciseName);
    } else if (action === "delete") {
      //if user chose to delete then
      await deleteExercise(exerciseID, workoutID);
    }
    res.redirect("/" + workoutID + "/exercises");
  })();
});

// * ROUTE HTTP GET FOR DAYS FROM AN EXERCISE
app.get("/:workoutID/:exerciseID/days", function (req, res) {
  const workoutID = req.params.workoutID; //get from params the workoutID
  const exerciseID = req.params.exerciseID; //get from params the exerciseID

  (async () => {
    //IIFE
    const days = await getDaysFromExercise(exerciseID); //Get all days from an /workout/exercise
    const exerciseName = await getExerciseNameById(exerciseID); //Get the name of current exercise
    if (days.length > 0) {
      //if days exists
      res.render("days", {
        //render day.ejs with them
        workoutID: workoutID,
        exerciseID: exerciseID,
        exerciseName: exerciseName,
        days: days,
      });
    } else {
      //if not
      res.render("days", {
        //render day.ejs but empty days array
        workoutID: workoutID,
        exerciseID: exerciseID,
        exerciseName: exerciseName,
        days: [],
      });
    }
  })();
});

// * ROUTE HTTP POST FOR ADDING DAYS INTO AN EXERCISE
app.post("/:workoutID/:exerciseID/days", function (req, res) {
  const exerciseID = req.params.exerciseID;
  const workoutID = req.params.workoutID;

  const day = new dataModel.Day({
    //Retrieve all inputs from the form
    date: getDate(req.body.date), //get date in appropiate format
    sets: req.body.sets,
    reps: req.body.reps,
    weight: req.body.weight,
  });

  (async () => {
    //IIFE
    await insertDay(workoutID, exerciseID, day); //insert day
    res.redirect("/" + workoutID + "/" + exerciseID + "/days");
  })();
});

// * ROUTE HTTP POST TO DELETE OR UPDATE A DAY
app.post("/:workoutID/:exerciseID/:dayID/modify", function (req, res) {
  const exerciseID = req.params.exerciseID;
  const workoutID = req.params.workoutID;
  const dayID = req.params.dayID; //get from params the Id of day to edit or remove
  const action = req.body.action; //either edit or remove

  (async () => {
    //IIFE
    if (action === "update") {
      //edit day with new inputs
      let day = {
        _id: dayID,
        date: getDate(req.body.date),
        sets: req.body.sets,
        reps: req.body.reps,
        weight: req.body.weight,
      };
      await updateDay(workoutID, exerciseID, day);
    } else if (action === "delete") {
      //delete day
      await deleteDay(workoutID, exerciseID, dayID);
    }
    res.redirect("/" + workoutID + "/" + exerciseID + "/days");
  })();
});

/**
 * Insert a Workout into workoutsDB
 *
 * @param {string} workoutName
 * @param {string} userId _id of the user inserting the workout
 */
async function insertWorkout(workoutName, userId) {
  const workout = new dataModel.Workout({
    name: workoutName,
    _userId: userId,
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

/**
 * Retrieve all exercises from a specific workout
 *
 * @param {string} workoutId _id of the workout
 * @returns {exercises[]} array of exercises
 */
async function getExercisesFromWorkout(workoutID) {
  const query = dataModel.Workout.findOne({ _id: workoutID });
  const workout = await query;
  return workout.exercises;
}

/**
 * Retrieve the name of a specific workout
 *
 * @param {string} workoutId _id of the workout
 * @returns {string} Name of the workout
 */
async function getWorkoutNameById(workoutID) {
  const query = dataModel.Workout.findOne({ _id: workoutID });
  const workout = await query;
  return workout.name;
}

/**
 * Create, Insert an exercise to workoutsDB
 *
 * @param {string} exerciseName name of the new exercise
 * @param {string} workoutID workout _id where exercise is pushed to
 */
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

/**
 * Retrieve all days from a specific exercise
 *
 * @param {string} exerciseID exercise _id where days are pulled from
 * @returns {days[]} array of days
 */
async function getDaysFromExercise(exerciseID) {
  const query = dataModel.Exercise.findOne({ _id: exerciseID });
  const exercise = await query;
  return exercise.days;
}

/**
 * Retrieve the name of an exercise, using exerciseID
 *
 * @param {string} exerciseID _id of the exercise
 * @returns {string} name of the exercise
 */
async function getExerciseNameById(exerciseID) {
  const query = dataModel.Exercise.findOne({ _id: exerciseID });
  const exercise = await query;
  return exercise.name;
}

/**
 * Create, insert Day into workoutsDB
 *
 * @param {string} workoutId _id of the workout, where day is pushed to
 * @param {string} array _id of the exercise, where day is pushed to
 * @param {dataModel.Day} day Day object to be inserted
 */
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

/**
 * Update Day from workoutsDB
 *
 * @param {string} workoutId _id of the workout, where day will be updated from
 * @param {string} exerciseID _id of the exercise, where day will be updated from
 * @param {dataModel.Day} day Day object to be updated
 */
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

/**
 * Delete Day from workoutsDB
 *
 * @param {string} workoutId _id of the workout, where day will be deleted from
 * @param {string} exerciseID _id of the exercise, where day will be deleted from
 * @param {dataModel.Day} day Day object to be deleted
 */
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

/**
 * Delete Workout from workoutsDB
 *
 * @param {string} workoutId _id of the workout to be deleted
 */
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

/**
 * Update name of a Workout from workoutsDB
 *
 * @param {string} workoutId _id of the workout to be updated
 * @param {string} workoutName new Name of the workout
 */
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

/**
 * Delete Exercise from workoutsDB
 *
 * @param {string} exerciseID _id of the exercise to be deleted
 * @param {string} workoutId _id of the workout, where exercise will be pulled from
 */
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

/**
 * Update Exercise from workoutsDB
 *
 * @param {string} exerciseID _id of the exercise to be updated
 * @param {string} workoutId _id of the workout, where exercise will be updated
 * @param {string} newName new Name of the exercise
 */
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

/**
 * Get date in the desire format. DD/MM/YYYY
 *
 * @param {date} date
 * @returns {string} Date in DD/MM/YYYY format
 */
function getDate(date) {
  const day = new Date(date);
  const options = { year: "numeric", month: "numeric", day: "numeric" };
  return day.toLocaleDateString("en-GB", options);
}

/**
 * *Middleware Section
 */

/**
 * Checks if user is logged in,
 * if true, redirects to "/Workouts", else next()
 *
 * @param {??} req
 * @param {??} res
 * @param {??} next
 * @returns {??}
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect("/workouts");
  } else {
    return next();
  }
}

/**
 * Check if user is logged in,
 * if true, allows access to whatever requested Route,
 * if not authenticated, redirects to "/Login"
 *
 * @param {} req HTTP Request
 * @param {} res HTTP Response
 * @param {} next Next Middleware function in the stack
 * @returns {}
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    // User is authenticated
    return next(); //Pass control to the next middleware function in the stack
  } else {
    return res.redirect("/login"); //If user is not authenticated, redirect to "/Login"
  }
}

// * Set express app to listen on port 3000
app.listen(3000, function () {
  console.log("Server started on port 3000");
});
