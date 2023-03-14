console.log("Hi this is the frontend.js");

$(document).ready(function () {
  $("#updateWorkoutModal").on("show.bs.modal", function (event) {
    let anchorTag = $(event.relatedTarget);
    let workoutId = anchorTag.data("workoutid");
    let modal = $(this);
    console.log("Update Workout Modal for " + workoutId);
    modal.find("form").attr("action", "/workouts/" + workoutId + "/modify");
  });
});

$(document).ready(function () {
  $("#updateExerciseModal").on("show.bs.modal", function (event) {
    let anchorTag = $(event.relatedTarget);
    let exerciseId = anchorTag.data("exerciseid");
    let modal = $(this);
    console.log("Update Exercise Modal for " + exerciseId);
    let actionAtt = modal.find("form").attr("action");
    let newActionAtt = actionAtt.replace("exerciseid", exerciseId);
    modal.find("form").attr("action", newActionAtt);
  });
});

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

//Toggle Eye - hide password
(function ($) {
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
})(jQuery);

function isUserLoggedIn() {
  if (document.cookie.includes("loggedIn")) {
    return true;
  } else {
    return false;
  }
}

//If user is not logged in then hide the logout button
if (!isUserLoggedIn()) {
  $(".logout-item").hide();
}
function redirectToWorkouts() {
  window.location.href = "/workouts";
}

function redirectToExercises() {
  const currentUrl = window.location.href;
  const segments = currentUrl.split("/");
  const workoutID = segments[3];
  window.location.href = "/" + workoutID + "/exercises";
}
