var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var formidable = require('formidable');
var mv = require('mv');

var User = mongoose.model('User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  User.find(function (err, users) {
    if (err) return next(err);
    res.json(users);
  });
});

// Find user by username (querying)
router.get('/find', function(req, res, next) {
  User.findOne({'username' : req.query.u}, function(err, user) {
    if (err) return next(err);
    res.json(user);
  });
});

router.param('user', function(req, res, next, id) {
  var query = User.findById(id);
  // some validations
  query.exec(function (err, user) {
    if (err) { return next(err); }
    if (!user) { return next(new Error('can\'t find user')); }

    req.user = user;
    return next();
  });
});

// Find user by id
router.get('/:user', function(req, res, next) {
  res.json(req.user);
});

router.put('/:user/updateAvatar', function (req, res, next) {
  var form = new formidable.IncomingForm();

  User.findById(req.user._id, function(err, user) {
    if (err) return next(err);

    var newAvatarPath = '/images/'+ user._id +'.png';
    user.avatarPath = newAvatarPath;
    // TODO Fix this parsing
    // Comment: Cannot read property 'path'(files.uploadAv.path) of undefined
    form.parse(req, function(err, fields, files) {
      // if (err) return next(err);
      console.log("parsing done!");
      mv(files.uploadAv.path, __dirname + newAvatarPath, function(err) {
        // if (err) return next(err);
        user.save();
      });
      res.end();
    });
  });
});

module.exports = router;
