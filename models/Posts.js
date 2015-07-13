var mongoose = require('mongoose');
var deepPopulate = require('mongoose-deep-populate');

var PostSchema = new mongoose.Schema({
  title: String,
  body: String,
  upvotes: { type: Number, default: 0 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

PostSchema.plugin(deepPopulate);

PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

PostSchema.methods.downvote = function(cb) {
  this.upvotes -= 1;
  this.save(cb);
};

mongoose.model('Post', PostSchema);