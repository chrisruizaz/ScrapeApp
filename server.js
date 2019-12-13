var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(URI);
// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Routes

app.get("/scrape", function(req, res) {
  axios.get("http://www.echojs.com/").then(function(response) {
    var $ = cheerio.load(response.data);
    $("article h2").each(function(i, element) {
      var result = {};
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });
    res.send("Scrape Complete");
  });
});
app.get("/articles", function(req, res) {
  db.Article.find({})
    .populate("note")
    .then(dbArticles => {
      res.json(dbArticles);
    })
    .catch(err => {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.find({ _id: mongoose.Types.ObjectId(req.params.id) })
    .populate("note")
    .then(dbArticles => {
      res.json(dbArticles);
    })
    .catch(err => {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(dbNote => {
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(dbArticle => {
      res.json(dbArticle);
    })

    .catch(err => {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
