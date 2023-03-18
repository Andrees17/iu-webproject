console.log("Hi this is the frontend.js");

/**
  Initializes a listener for when the "update workout" modal is shown.
  When the modal is shown, it extracts the workout ID from the triggering element
  and sets the "action" attribute of the form in the modal to point to the corresponding update route.
*/
$(document).ready(function () {
  $("#updateWorkoutModal").on("show.bs.modal", function (event) {
    //event listener
    // Get the element that triggered the event and the value of 'data-workoutid' attribute
    let anchorTag = $(event.relatedTarget);
    let workoutId = anchorTag.data("workoutid");
    let modal = $(this);
    console.log("Update Workout Modal for " + workoutId);
    // find and update the action attriibute of the form within the modal
    modal.find("form").attr("action", "/workouts/" + workoutId + "/modify");
  });
});

/**

Initializes a listener for when the "updateExerciseModal" modal is shown.
When the modal is shown, it extracts the exercise ID from the triggering element
and sets the "action" attribute of the form in the modal to point to the corresponding update route.
*/
$(document).ready(function () {
  $("#updateExerciseModal").on("show.bs.modal", function (event) {
    //event listener
    // Get the element that triggered the event and the value of 'data-exerciseid' attribute
    let anchorTag = $(event.relatedTarget);
    let exerciseId = anchorTag.data("exerciseid");
    let modal = $(this); // Get a reference to the modal element
    console.log("Update Exercise Modal for " + exerciseId);
    let actionAtt = modal.find("form").attr("action"); // Get current of value of the action att
    let newActionAtt = actionAtt.replace("exerciseid", exerciseId); // Replace a portion of the actionAtt with exerciseId
    modal.find("form").attr("action", newActionAtt); //Add new actionAtt to the modal
  });
});

/**

Initializes a listener for when the "updateDayModal" modal is shown.
When the modal is shown, it extracts the day object from the triggering element
and sets the "action" attribute of the form in the modal to point to the corresponding update route.
It also sets the values of the input fields in the modal to the corresponding values in the day object.
* !Same logic as the two functions above.
*/
$(document).ready(function () {
  $("#updateDayModal").on("show.bs.modal", function (event) {
    let anchorTag = $(event.relatedTarget);
    let day = anchorTag.data("day");
    let modal = $(this);
    console.log("Update Day Modal for " + day);
    let actionAtt = modal.find("form").attr("action");
    let newActionAtt = actionAtt.replace("dayid", day._id);
    modal.find("form").attr("action", newActionAtt);
    modal.find("input[name='sets']").attr("value", day.sets);
    modal.find("input[name='reps']").attr("value", day.reps);
    modal.find("input[name='weight']").attr("value", day.weight);

    //format it into a string in the proper ISO date format that the input type="date" accepts
    let dateString = day.date;
    let parts = dateString.split("/");
    let isoDateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
    modal.find("input[name='date']").attr("value", isoDateString);
  });
});

/**
 Toggle Eye - hide password
 */
(function ($) {
  // Dollar sign references the jQuery object
  "use strict";

  $(".toggle-password").click(function () {
    $(this).toggleClass("fa-eye fa-eye-slash");
    var input = $($(this).attr("toggle"));
    if (input.attr("type") == "password") {
      input.attr("type", "text");
    } else {
      input.attr("type", "password");
    }
  });
})(jQuery); // jQuery Object as argument invoking the IIFE

/**
 * Checks if the user is logged in
 * by looking if there is a loggedIn Cookie
 * @returns {boolean} true if logged in
 */
function isUserLoggedIn() {
  if (document.cookie.includes("loggedIn")) {
    return true;
  } else {
    return false;
  }
}

/**
 * If User is not loggedIn = is loggedOut
 * hide .lougout-item
 */
if (!isUserLoggedIn()) {
  $(".logout-item").hide();
}

/**
 * Function called by a "Go back" button to comeback to /workouts
 */
function redirectToWorkouts() {
  window.location.href = "/workouts";
}

/**
 * Function called by a "Go back" button to comeback to exercises of a specific workout
 */
function redirectToExercises() {
  const currentUrl = window.location.href;
  const segments = currentUrl.split("/");
  const workoutID = segments[3];
  window.location.href = "/" + workoutID + "/exercises";
}
