(function() {
  var app = angular.module('formuse');
  
  app.controller('MainCtrl', ['$scope', function($scope) {
    $scope.paragraph = 'Hi i\'m a paragraph';
  }]);
})();
