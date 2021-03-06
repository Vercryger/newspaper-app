var app = angular.module('flapperNews', ['ui.router']);

app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
    	resolve: {
		    postPromise: ['posts', function(posts){
		      return posts.getAll();
		    }]
		  }
		})

    .state('posts', {
		  url: '/posts/{id}',
		  templateUrl: '/posts.html',
		  controller: 'PostsCtrl',
		  resolve: {
		    post: ['$stateParams', 'posts', function($stateParams, posts) {
		      return posts.get($stateParams.id);
		    }]
		  }
		})

    // TODO Extract controller and Factory service
		.state('user', {
    	url: '/users/{id}',
    	templateUrl: '/user.html',
    	controller: ['$scope', 'user', function($scope, user) {
    		$scope.user = user;
    	}],
    	resolve: {
    		user: ['$stateParams', '$http', function($stateParams, $http) {
    			return $http.get('/users/'+$stateParams.id).then(function(res) {
    				return res.data;
    			});
    		}]
    	}
    })
   
   	.state('editUsrPrfl', {
   		url: '/users/{id}/edit',
   		templateUrl: '/user-edit.html',
   		controller: ['$scope', '$http', 'profile', function($scope, $http, profile) {
   			$scope.profile = profile;
   			$scope.updateAvatar = function() {
   				$http.put('/users/'+profile._id+'/updateAvatar', null);
   			};
   		}],
   		resolve: {
   			profile: ['$stateParams', '$http', function($stateParams, $http) {
    			return $http.get('/users/'+$stateParams.id).then(function(res) {
    				return res.data;
    			});
    		}]
   		}
   	})

   	// ----------
		.state('login', {
		  url: '/login',
		  templateUrl: '/login.html',
		  controller: 'AuthCtrl',
		  onEnter: ['$state', 'auth', function($state, auth){
		    if(auth.isLoggedIn()){
		      $state.go('home');
		    }
		  }]
		})

		.state('register', {
		  url: '/register',
		  templateUrl: '/register.html',
		  controller: 'AuthCtrl',
		  onEnter: ['$state', 'auth', function($state, auth){
		    if(auth.isLoggedIn()){
		      $state.go('home');
		    }
		  }]
		});

  $urlRouterProvider.otherwise('/');
}]);

app.factory('posts', ['$http', 'auth', function($http, auth) {
  var o = {
    posts: []
  };
  
  o.getAll = function() {
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts);
    });
  };

  o.create = function(post) {
	  return $http.post('/posts', post, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}	
	  }).success(function(data){
	    o.posts.push(data);
	  });
	};

	o.upvote = function(post) {
		return $http.put('/posts/'+ post._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data) { // TODO Remove data parameter
			post.upvotes += 1;
		});
	};

	o.downvote = function(post) {
		return $http.put('/posts/'+ post._id + '/downvote', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data) { // TODO Remove data parameter
			post.upvotes -= 1;
		});
	};

	o.get = function(id) {
	  return $http.get('/posts/' + id).then(function(res){
	    return res.data;
	  });
	};

	o.addComment = function(id, comment) {
	  return $http.post('/posts/' + id + '/comments', comment, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
	  });
	};

	o.upvoteComment = function(post, comment) {
	  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    comment.upvotes += 1;
	  });
	};

	o.downvoteComment = function(post, comment) {
	  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/downvote', null, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	    comment.upvotes -= 1;
	  });
	};

  return o;
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
	var auth = {};

	auth.saveToken = function (token){
	  $window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function (){
	  return $window.localStorage['flapper-news-token'];
	}
  
	auth.isLoggedIn = function(){
	  var token = auth.getToken();

	  if(token){
	    var payload = JSON.parse($window.atob(token.split('.')[1]));

	    return payload.exp > Date.now() / 1000;
	  } else {
	    return false;
	  }
	};

  auth.currentUser = function() {
	  if(auth.isLoggedIn()){
	    var token = auth.getToken();
	    var payload = JSON.parse($window.atob(token.split('.')[1]));

	    return payload;
	  }
	};

	auth.register = function(user){
	  return $http.post('/register', user).success(function(data){
	    auth.saveToken(data.token);	
	  });
	};

	auth.logIn = function(user){
	  return $http.post('/login', user).success(function(data){
	    auth.saveToken(data.token);
	  });
	};

	auth.logOut = function(){
	  $window.localStorage.removeItem('flapper-news-token');
	};

  return auth;
}])

app.controller('MainCtrl', ['$scope', 'posts' , 'auth',
	function($scope, posts, auth) {
		$scope.posts = posts.posts;

		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.addPost = function() {
		  if(!$scope.title || $scope.title === '') { return; }
		  posts.create({
		    title: $scope.title,
		    link: $scope.link,
		    upvotes: 0,
		    comments: []
		  });
		  $scope.title = '';
		};

		$scope.incrementUpvotes = function(post) {
		  posts.upvote(post).error(function(error) {
	    	$scope.error = error;
	    });
		};
		$scope.decrementUpvotes = function(post) {
		  posts.downvote(post).error(function(error) {
		  	$scope.error = error;
		  });
		};
	}
]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth',
	function($scope, $state, auth) {
  	$scope.user = {};

  	$scope.correctPassword = function() {
  		return $scope.user.password == $scope.user.confirmedPassword;
  	};

  	$scope.emptyPassword = function() {
  		return !$scope.user.password;
  	};

	  $scope.register = function() {
	    auth.register($scope.user).error(function(error) {
	      $scope.error = error;
	    }).then(function() {
	      $state.go('home');
	    });
	  };

	  $scope.logIn = function() {
	    auth.logIn($scope.user).error(function(error) {
	      $scope.error = error;
	    }).then(function() {
	      $state.go('home');
	    });
	  };
	}
]);

app.controller('NavCtrl', ['$scope', 'auth',
	function($scope, auth) { 
	  $scope.isLoggedIn = auth.isLoggedIn;
	  $scope.currentUser = auth.currentUser;
	  $scope.logOut = auth.logOut;
	}
]);

app.controller('PostsCtrl', ['$scope', 'posts', 'post', 'auth',
	function($scope, posts, post, auth) {
		$scope.post = post;
		
		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.addComment = function(){
		  if(!$scope.body) { return; }
		 	posts.addComment(post._id, {
		    body: $scope.body,
		    upvotes: 0
		  }).success(function(comment) {
		    $scope.post.comments.push(comment);
		  });

		  $scope.body = '';
		};

		$scope.incrementUpvotes = function(comment) {
		  posts.upvoteComment(post, comment);
		};
		$scope.decrementUpvotes = function(comment) {
		  posts.downvoteComment(post, comment);
		};
	}
]);
