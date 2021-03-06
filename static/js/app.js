'use strict';
// Declare app level module which depends on views, and components
angular.module('backend', [
  'ngCookies',
  'ui.router',
  'ui.bootstrap',
  'firebase',
  'app.config',
  'app.services',
  'controllers'
])

.value('ParseConfiguration', {
  applicationId: '',
  javascriptKey: '',
  restKey: '',
  sessionToken: ''
})

.run(['$rootScope', '$state', function($rootScope, $state) {
  $rootScope.$on('$stateChangeError',
    function(event, toState, toParams, fromState, fromParams, err) {
      // debugger;
      console.log('$stateChangeError ' + err && (err.debug || err.message || err));

      //if the error is noUser, go to login state
      if( err && err.error === 'noUser'){
        console.log('noUser @$stateChangeError');
        event.preventDefault();
        $state.go('login');
      }
    }
  );
}])

.filter('rawHTML', ['$sce', function($sce){
  return function(val) {
    return $sce.trustAsHtml(val);
  };
}])
.filter('trustURL', ['$sce', function($sce) {
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
}])
.filter('customTimeString', function() {
  return function(val, showHourMinute) {
    showHourMinute = showHourMinute || false;
    var now = new Date();
    var d = new Date(val);
    //modify last message time string
    var deltaTime = now - d;
    if( showHourMinute && deltaTime < 12*3600*1000){
      return d.getHours() + "時" + d.getMinutes() + "分";
    }else{
      return d.getMonth() + 1 + "月" + d.getDate() + "日";
    }
  };
})
.filter('wordCaption', function() {
  return function(word) {
    if(word.isRuined){
      if(word.isBlue){
        return '藍方廢墟';
      }else if(word.isRed){
        return '紅方廢墟';
      }else{
        return '無辜居民廢墟';
      }
    }else if(word.isOccupied){
      if(word.isBlue){
        return '紅方和第三方共同佔領區';
      }else if(word.isRed){
        return '藍方和第三方共同佔領區';
      }else{
        return '';
      }
    }else if(word.isRed){
      return '紅方區域';
    }else if(word.isBlue){
      return '藍方區域';
    }
  }
})
.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {


  $stateProvider
  .state('index', {
    url: '/',
    templateUrl: 'index.html',
    controller: 'IndexController'
  })
  .state('island', {
    url: '/island',
    abstruct: true,
    template: '<ui-view/>'
  })
  .state('island.create', {
    url: '/create',
    templateUrl: 'create-island.html',
    controller: 'CreateislandController'
  })
  .state('island.join', {
    url: '/join',
    templateUrl: 'join-island.html',
    controller: 'JoinislandController'
  })
  .state('island.playboard', {
    url: '/:islandKey',
    templateUrl: 'playboard.html',
    controller: 'PlayboardController'
  })
  .state('login', {
    url: '/login',
    templateUrl: 'login.html',
    controller: 'LoginController'
  })
  ;
  $urlRouterProvider.otherwise('/');
}])
;
