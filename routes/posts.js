var express  = require('express');
var router = express.Router();
var Post = require('../models/Post');
var User = require('../models/User');
var Comment = require('../models/Comment');
var util = require('../util');

// Index
router.get('/', async function(req, res){
  let ctgr = req.query.category;
  let align = req.query.align;

  if (!align){ align = '-createdAt'}

  if(!ctgr){
    Post.find({})
      .populate('author')
      .sort(align)
      .exec(function(err, posts){
        if(err) return res.json(err);
        res.render('posts/index', {posts:posts, ctgr:''});
      });
  }
  else if(ctgr == '서록관'){
    Post.find({category:['서록1관', '서록2관']})
      .populate('author')
      .sort('-createdAt')
      .exec(function(err, posts){
        if(err) return res.json(err);
        res.render('posts/index', {posts:posts, ctgr:req.query.category});
    });
  }
  else{
    Post.find({category:ctgr})
      .populate('author')
      .sort('-createdAt')
      .exec(function(err, posts){
        if(err) return res.json(err);
        res.render('posts/index', {posts:posts, ctgr:ctgr});
    });
  }
});


// New
router.get('/new', function(req, res){
  var post = req.flash('post')[0] || {};
  var errors = req.flash('errors')[0] || {};
  res.render('posts/new', { post:post, errors:errors });
});

// create
router.post('/', function(req, res){
  req.body.author = req.user._id;
  Post.create(req.body, function(err, post){
    if(err){
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/new');
    }
    res.redirect('/posts');
  });
});

// show
router.get('/:id', function(req, res){
  var commentForm = req.flash('commentForm')[0] || { _id: null, form: {} };
  var commentError = req.flash('commentError')[0] || { _id:null, parentComment: null, errors:{}};

  Promise.all([
      Post.findOne({_id:req.params.id}).populate({ path: 'author', select: 'username' }),
      Comment.find({post:req.params.id}).sort('createdAt').populate({ path: 'author', select: 'username' })
    ])
    .then(([post, comments]) => {
      var commentTrees = util.convertToTrees(comments, '_id','parentComment','childComments');                               //2
      res.render('posts/show', { post:post, commentTrees:commentTrees, commentForm:commentForm, commentError:commentError}); //2
    })
    .catch((err) => {
      return res.json(err);
    });
 });

// edit
router.get('/:id/edit', function(req, res){
  var post = req.flash('post')[0];
 var errors = req.flash('errors')[0] || {};
 if(!post){
  Post.findOne({_id:req.params.id}, function(err, post){
    if(err) return res.json(err);
    res.render('posts/edit', {post:post, errors:errors});
  });
}
else {
 post._id = req.params.id;
 res.render('posts/edit', { post:post, errors:errors });
}
});

// update
router.put('/:id', function(req, res){
  req.body.updatedAt = Date.now();
  Post.findOneAndUpdate({_id:req.params.id}, req.body, {runValidators:true}, function(err, post){
    if(err){
      req.flash('post', req.body);
      req.flash('errors', util.parseError(err));
      return res.redirect('/posts/'+req.params.id+'/edit');
    }
    res.redirect('/posts/'+req.params.id);
  });
});


// destroy
router.delete('/:id', function(req, res){
  Post.deleteOne({_id:req.params.id}, function(err){
    if(err) return res.json(err);
    res.redirect('/posts');
  });
});

// nav


module.exports = router;
