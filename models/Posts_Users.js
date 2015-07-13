var mongoose = require('mongoose');

var PostUserSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  vote: Boolean // true for upvote - false for downvote
});

mongoose.model('PostUser', PostUserSchema);