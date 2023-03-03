const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
//enable use of lodash inside a ejs template
app.locals._ = _;


// GET ROOT
app.get("/", function (req, res) {
    res.send("<h1> Hello World </h1>")
})












//LISTEN PORT 3000
app.listen(3000, function () {
    console.log("Server started on port 3000");
});