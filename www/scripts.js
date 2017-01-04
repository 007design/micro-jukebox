/* global angular */
"use strict";

angular.module('app', ['ngRoute', 'btford.socket-io'])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'pages/home.html',
      controller: 'HomeCtrl'
    })
    .when('/files/:path*?', {
      templateUrl: 'pages/files.html',
      controller: 'FilesCtrl'
    })
    .when('/db', {
      templateUrl: 'pages/db.html',
      controller: 'DbCtrl'
    })
    .otherwise({
      redirectTo: '/'
    });
}])

.factory('socket', function (socketFactory) {
  return socketFactory();
})

.controller('FilesCtrl', ['$scope', function($scope) {

}])

.controller('HomeCtrl', ['$scope', function($scope) {

}])

.controller('DbCtrl', ['$scope', function($scope) {

}])

.service('dataSvc', ['$http', 'socket', function($http, socket) {
  var scope = this;
  scope.busy = false;
  scope.status, scope.track;

  socket.on('status', function(status) {
    console.log('status', status)
    scope.status = status;
  });

  socket.on('refresh', function(status) {
    console.log(status)
    if (status === 'done')
      scope.getList();
  });

  // function poll() {
  //   $http.get('/status')
  //     .success(function(data) {
  //       if (data.status === 'busy')
  //         setTimeout(poll,1000);
  //       else {
  //         scope.busy = false;
  //         scope.getList();
  //       }
  //     });
  // }

  scope.getList = function() {
    $http.get('/list')
      .success(function(data) {
        scope.fileList = data;
        scope.busy = false;
      });
  };

  scope.getDir = function(dir) {
    dir = dir || '';
    $http.get('/dir', {
      params: {
        d: dir
      }
    }).success(function(data) {
      scope.busy = true;
    });
  };

  scope.getTracks = function() {
    $http.get('/tracks')
      .success(function(data) {
        scope.busy = true;
      });
  };

  scope.play = function(file) {
    if (scope.playing) {
      if (scope.track == file)
        return socket.emit('pause');
      else {
        socket.emit('stop');
        return scope.play(file);
      }
    }

    if (scope.track === file)
      return socket.emit('resume');

    scope.track = file;
    socket.emit('play', file);
  };

  scope.refresh = function() {
    scope.busy = true;
    socket.emit('refresh')
  };

  return scope;
}])

.directive('fileList', ['dataSvc', '$location', '$routeParams', function(dataSvc, $location, $routeParams) {
  return {
    restrict: 'C',
    link: function(scope) {
      scope.$watch(function() {
        return dataSvc.fileList;
      }, function(f) {
        scope.files = f;
      });

      scope.$watch(function() {
        return dataSvc.status;
      }, function(s) {
        scope.status = s;
      });

      scope.$watch(function() {
        return $routeParams.path;
      }, function(d) {
        dataSvc.getDir(d);
      });

      scope.play = function(file) {
        dataSvc.play(file);
      };
    }
  };
}])

.directive('trackList', ['dataSvc', function(dataSvc) {
  return {
    restrict: 'C',
    link: function(scope) {
      scope.$watch(function() {
        return dataSvc.fileList;
      }, function(t) {
        scope.tracks = t;
      });

      scope.$watch(function() {
        return dataSvc.status;
      }, function(s) {
        scope.status = s;
      });

      scope.$watch(function() {
        return dataSvc.busy;
      }, function(b) {
        scope.busy = b;
      });

      dataSvc.getTracks();

      scope.play = function(file) {
        dataSvc.play(file);
      };

      scope.refresh = function() {
        dataSvc.refresh();
      };
    }
  };
}]);
