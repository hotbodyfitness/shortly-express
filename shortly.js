var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session'); // added this middleware

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'very secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires:600000
  }
}));

var username, password;

app.get('/', util.checkUser, function (req, res) {
    // if (util.checkUser(username, password)) {
    //   res.render('index');
    // } else {
    //   res.redirect('/login');
    // }
    res.render('index');
  });

app.get('/signup', function (req, res) {
  res.render('signup');
  //console.log('signup get request');
})

app.post('/signup', function (req, res) {
  new User({
    'username': req.body.username,
    'password': req.body.password
  }).save().then((result) => {
    username = result.attributes.username;
    password = result.attributes.password;
    res.redirect('/');
  });
});

// app.get('/create', util.checkUser,
//   function (req, res) {
//     res.render('create');
//   });

app.get('/links', util.checkUser,
  function (req, res) {
      Links.reset().fetch()
        .then(function (links) {
          res.status(200).send(links.models);
        });
  });

app.post('/links',
  function (req, res) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }

    new Link({ url: uri }).fetch().then(function (found) {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function (err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
            .then(function (newLink) {
              res.status(200).send(newLink);
            });
        });
      }
    });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', (req, res, next) => {
  res.render('login')
  console.log('login get request');
});

app.post('/login', (req, res) => {
  var user = req.body.username;
  var pass = req.body.password;
  //db.knex.select('username').from('users')(`${user} = username`).then(function(users) {
  db.knex.raw(`SELECT username, password FROM users WHERE username IN ('${user}') AND password IN ('${pass}')`)
    .then(function (users) {
      if (users.length) {
        // username = users[0].username;
        // password = users[0].password;
        // res.redirect('/');
        req.session.regenerate(function(){
          req.session.user = user;
          username = user;
          console.log('******************* session.user *********************** \n', req.session.user);
          res.redirect('/');
          });

      } else {
        console.log("Not Logged In");
        res.redirect('/login');
        // alertThem();
      }
    });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', util.checkUser, function (req, res) {
  new Link({ code: req.params[0] }).fetch().then(function (link) {
    if (!link) {
      res.redirect('/');

    } else {
      // if (util.checkUser(username, password)) {

        var click = new Click({
          linkId: link.get('id')
        });

        click.save().then(function () {
          link.set('visits', link.get('visits') + 1);
          link.save().then(function () {
            return res.redirect(link.get('url'));
          });
        });

      // } else {
      //   res.redirect('/login');
      // }
    }
  });
});

module.exports = app;