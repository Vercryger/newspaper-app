var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var User = mongoose.model('User');
var PostUser = mongoose.model('PostUser');
var Comment = mongoose.model('Comment');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Flapper News' });
});

router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);
  // some validations
  query.exec(function (err, post) {
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment) {
    if (err) { return next(err); }
    if (!comment) { return next(new Error('can\'t find comment')); }

    req.comment = comment;
    return next();
  });   
});

router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    Post.populate(posts, {path: 'author'}, function(err, posts) {
      if(err){ return next(err); }

      res.json(posts);
    });
  });
});

router.get('/posts/:post', function(req, res, next) {
  req.post.deepPopulate('comments.author', function(err, post) {
    if (err) { return next(err); }

    res.json(post);
  });
});

router.post('/posts', auth, function(req, res, next) {
  var post = new Post(req.body);
  post.author = new User(req.payload);
  post.save(function(err, post) {
    if(err) { return next(err); }
    res.json(post);
  });
}); 

router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;
  comment.author = new User(req.payload);

  comment.save(function(err, comment){
    if (err) { return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if (err) { return next(err); }

      res.json(comment);
    });
  });
});

router.put('/posts/:post/upvote', auth, function(req, res, next) {
  var post = req.post;
  var user = new User(req.payload);
  var postUserData = {'user': post.id,'post': user.id, 'vote': true};
  var postUser = new PostUser(postUserData);

  PostUser.find(postUserData, function(err, data) {
    if (data.length != 0) return res.status(400).json({message: 'you already upvoted this!'});
    
    req.post.upvote(function(err, post) {
      if (err) { return next(err); }

      postUser.save(function(err, postuser) {
        if (err) { return next(err); }
        res.json(post);
      });
    });
  });
});

router.put('/posts/:post/downvote', auth, function(req, res, next) {
  var post = req.post;
  var user = new User(req.payload);
  var postUserData = {'user': post.id,'post': user.id, 'vote': false};
  var postUser = new PostUser(postUserData);

  PostUser.find(postUserData, function(err, data) {
    if (data.length != 0) return res.status(400).json({message: 'you already downvoted this!'});
    
    req.post.downvote(function(err, post) {
      if (err) { return next(err); }

      postUser.save(function(err, postuser) {
        if (err) { return next(err); }
        res.json(post);
      });
    });
  });
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(function(err, comment) {
    if (err) { return next(err); }

    res.json(comment)
  });
});

router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next) {
  req.comment.downvote(function(err, comment) {
    if (err) { return next(err); }

    res.json(comment)
  });
});

//-------------------------------------------------//
//----------------- USER ROUTES -------------------//

router.post('/register', function(req, res, next){
  if( !req.body.username || !req.body.password ) {
    return res.status(400).json({message: 'Please fill out all fields!'});
  }

  if( req.body.password != req.body.confirmedPassword ) {
    return res.status(400).json({message: 'Incorrect password!'});
  }

  var user = new User();

  user.username = req.body.username;

  user.setPassword(req.body.password)

  user.save(function (err) {
    if(err) { return res.status(400).json({ message: 'Oops! It seems like this user already exists :/'}); }

    return res.json({token: user.generateJWT()})
  });
});

router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);
});

module.exports = router;
