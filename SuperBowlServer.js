var express = require('express'),
    _ = require('underscore'),
    path = require('path'),
    fs = require('fs'),
    request = require('request'),
    usersController = require('./controllers/users.js'),
    boxesController = require('./controllers/boxes.js'),
    passport = require('passport'),
    cons = require('consolidate'),
    swig = require('swig'),
    TwitterStrategy = require('passport-twitter').Strategy,
    twitterPath = '/login/twitter',
    twitterReturnPath = twitterPath + '/return',
    MongoStore = require('connect-mongo')(express);
    
var User = require('./models/user.js')["User"];
var Box = require('./models/box.js')["Box"];

var mongoose = require('mongoose');
mongoose.connect('mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB);

var SuperBowl = {};
SuperBowl.app = express();
SuperBowl.app.use(express.static(path.join(__dirname+'/views')));
SuperBowl.app.engine('.html', cons.swig);
SuperBowl.app.set('view engine', 'html');
SuperBowl.app.set('views', './templates/');

SuperBowl.app.use(passport.initialize());
SuperBowl.app.use(express.cookieParser(process.env.COOKIE_SECRET));
SuperBowl.app.use(express.session({
    store: new MongoStore({
        url: 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB
    }),
    secret: process.env.COOKIE_SECRET
}));
SuperBowl.app.use(SuperBowl.app.router);

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: process.env.PROJECT_URL + twitterReturnPath,
      // Twitter returns plenty of info if you want it
      includeStatus: false,
      includeEntities: false      
    },
    function(token, tokenSecret, profile, cb) {
        User.findOne({
            'id': profile.id
        }, function(err, user) {
            if (err) {
                return cb(err);
            }
            // checks if the user has been already been created, if not
            // we create a new instance of the User model
            if (!user) {
                user = new User({
                    id: profile.id,
                    userId: profile.id,
                    name: profile.displayName,
                    username: profile.username,
                    email: profile.email,
                    first_name: profile.displayName,
                    last_name: profile.displayName,
                    provider: 'twitter',
                    userPhoto: {
                        width: 160,
                        height: 160,
                        url: profile.photos[0].value
                    },
                    access_token: token,
                    boxCount: 0
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return cb(err, user);
                });
            } else {
                user.access_token = token;
                user.userPhoto = {
                    width: 160,
                    height: 160,
                    url: profile.photos[0].value
                };
                user.save();
                return cb(err, user);
            }
        });
    }
));

SuperBowl.getSessionUser = function(req, res, callback) {
    User.findOne({
        'id': req.session.user.id
    }, function(err, sessionUser) {
        if (sessionUser) {
            callback(sessionUser);
        } else {
            res.setHeader("Content-Type","application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.send({error: 'Unable to fetch session user'});
        }
    });
};

/*
 * -------------- App Functions --------------
 */
SuperBowl.app.get('/addBox', function(req, res) {
    res.setHeader("Content-Type","application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    var params = req.query;

    if (params.index && params.userId) {
        var addBox = function(sessionUser) {
            var addBoxCallback = function(savedSelectedBox) {
                var reponse = savedSelectedBox ? savedSelectedBox : {err: 'Selected box was not saved, please try again'};
                if (savedSelectedBox){
                    sessionUser.boxCount++;
                    sessionUser.save(function() {
                        req.session.user = sessionUser;
                    });
                }
                res.send(reponse);
            };

            boxesController.addBox(params, addBoxCallback);
        };
        SuperBowl.getSessionUser(req, res, addBox);
    } else {
        res.send({error: 'Please supply both an index and userId'});
    }
});

SuperBowl.app.get('/removeBox', function(req, res) {
    res.setHeader("Content-Type","application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    var params = req.query;

    if (params.index && params.userId) {
        var removeBox = function(sessionUser) {
            boxesController.removeBox(params, function(boxes){
                sessionUser.boxCount--;
                sessionUser.save(function() {
                    req.session.user = sessionUser;
                    res.send(boxes);
                });
            });
        };
        SuperBowl.getSessionUser(req, res, removeBox);
    } else {
        res.send({error: 'Please supply a valid index'});
    }
});

SuperBowl.app.get('/removeAllBoxes', function(req, res){
    boxesController.removeAllBoxes(function(){
        res.setHeader("Content-Type","application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send({message: 'All selected boxes have been removed.'});
    });
});

SuperBowl.app.get('/boxes', function(req, res) {
    boxesController.getAllBoxes(function(docs){
        res.setHeader("Content-Type","application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(docs);
    });
});

SuperBowl.app.get('/users', function(req, res) {
    usersController.getAllUsers(function(docs){
        res.setHeader("Content-Type","application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(docs);
    });
});

SuperBowl.app.get('/userList', function(req, res) {
    usersController.userList(function(docs){
        res.setHeader("Content-Type","application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send(docs);
    });
});

SuperBowl.app.get('/addUser', function(req, res) {
    var params = req.query;
    res.setHeader("Content-Type","application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    var addUserCallback = function(savedUser) {
        var reponse = savedUser ? savedUser : {err: 'Selected user was not saved, please try again'};
        res.send(reponse);
    };

    if (params.userInfo) {
        var userInfo = JSON.parse(params.userInfo);
        usersController.addUser(userInfo, addUserCallback);
    } else {
        res.send({err: 'Please supply a valid userId'});
    }
});

SuperBowl.app.get('/removeAllUsers', function(req, res){
    usersController.removeAllUsers(function(){
        res.setHeader("Content-Type","application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.send({message: 'All users have been removed.'});
    });
});

/**
 * Return all the selected boxes
 * @param callback - function(docs) array of returned docs, will return empty list if none are found
 */
SuperBowl.app.get('/squareData', function(req, res) {
    res.setHeader("Content-Type","application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    var onSessionUserFetched = function(sessionUser) {
        var squareData = {
            selectedBoxes: {},
            userData: sessionUser
        };

        Box.find({}).exec(function(err, docs){
            if (!err) {
                var selectedBoxes = {};
                for (var ii = 0; ii < docs.length; ii++) {
                    var aDoc = docs[ii];
                    selectedBoxes[aDoc.index] = aDoc.userId;
                }
                squareData.selectedBoxes = selectedBoxes;
            }
            res.send(squareData);
        });
    }
    SuperBowl.getSessionUser(req, res, onSessionUserFetched);
});

SuperBowl.app.get('/', function(req, res){
    res.setHeader("Content-Type","text/html");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        res.render('index.html', {userData: '' + JSON.stringify(req.session.user)});
    }
});

SuperBowl.app.get('/login', function(req, res){
    res.setHeader("Content-Type","text/html");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.render('login.html');
});

SuperBowl.app.get(twitterPath, passport.authenticate('twitter', {
    failureRedirect: '/'
}));

SuperBowl.app.get(twitterReturnPath, passport.authenticate('twitter', {
    failureRedirect: '/'
}), function(req, res) {
    User.findOne({
        'id': req.user.id
    }, function(err, user) {
        if (!err) {
            req.session.user = user;
        }
        res.redirect('/');
    });
});

SuperBowl.app.get('/auth/logout', function(req, res) {
    req.session.destroy();
    res.setHeader("Content-Type","application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send({success: true});
});

SuperBowl.app.listen(process.env.PORT);