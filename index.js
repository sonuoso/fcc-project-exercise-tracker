const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser')
let mongoose = require('mongoose');

mongoose.connect("mongodb+srv://develop:develop@cluster0.zqksdmc.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

//Initiating Middleware for bodyParser
app.use('/', bodyParser.urlencoded({ extended: false }));
app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Creating Schema for User
const userSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String
  }
});

//Creating Schema for Exercise
const exerciseSchema = new mongoose.Schema({
  user_id: {
    required: true,
    type: String
  },
  description: {
    required: true,
    type: String
  },
  duration: {
    required: true,
    type: Number
  },
  date: {
    type: Date
  }
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema)

app.route('/api/users').post(function(req, res) {
  let user = new User({
    username: req.body.username
  })
  //Saving user document and passing values to Response object
  user.save();
  res.json({ username: user.username, _id: user._id })
}).get(function(req, res) {
  User.find({}).then(data => res.send(data))
})

app.route('/api/users/:_id/exercises').post(function(req, res) {
  //Using current date if user hasn't provided
  let dateString = new Date();
  if (req.body.date) {
    dateString = new Date(req.body.date);
  }
  let exercise = new Exercise({
    user_id: req.params._id,
    description: req.body.description,
    duration: req.body.duration,
    date: dateString
  })
  //Saving exercise document after setting values
  exercise.save();
  //Retrieving username corresponding to the user_id from exercise
  User.findById(req.params._id).then(data =>
    res.json({ username: data.username, description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString(), _id: exercise.user_id }))
})


app.get('/api/users/:_id/logs', async function(req, res) {
  let fromDate = req.query.from;
  let toDate = req.query.to;
  let userName = await User.findById(req.params._id);

  //Creating a query for find() on Exercise collection depending on optional query strings
  let findQuery = { user_id: req.params._id };
  if (fromDate || toDate) {
    if (fromDate && toDate) {
      findQuery.date = { $gte: req.query.from, $lt: req.query.to }
    }
    else
      if (fromDate) {
        findQuery.date = { $gte: req.query.from }
      }
      else {
        findQuery.date = { $lt: req.query.to }
      }
  }

  let userExercise = await Exercise.find(findQuery).limit(req.query.limit).select('description duration date -_id');

  //Organizing the objects within the userExercise array
  userExercise.forEach((e,i ) => {
  userExercise[i] = {description: userExercise[i].description, duration: userExercise[i].duration, date: new Date(userExercise[i].date).toDateString()};
  }
)
  res.json({ username: userName.username, count: +(userExercise.length), _id: userName._id, log: userExercise })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
