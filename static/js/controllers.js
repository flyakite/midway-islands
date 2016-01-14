'use strict';
angular.module('controllers', [])

.controller('IndexController', 
  ['$scope', '$state', 'APP_CONFIG', 'DataStore', 
  function($scope, $state, APP_CONFIG, DataStore) {
  
  $scope.isIndex = true;  
}])


.controller('CreateislandController', 
  ['$scope', '$state', 'APP_CONFIG', '$firebaseObject', '$firebaseArray', 
  function($scope, $state, APP_CONFIG, $firebaseObject, $firebaseArray) {

  var islandsRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands');
  var islands = $firebaseArray(islandsRef);
  $scope.islandCapacity = 4;

  $scope.createisland = function() {
    console.log('create');
    var islandNumber = Math.floor(100000 + Math.random()*89999);
    console.log(islandNumber);
    var island = {
      number: islandNumber,
      capacity: $scope.islandCapacity
    };
    // fireRef.child('/islands/' + islandNumber).once('value', function(result) {
    //   if(result === null){
    //     fireRef.child('/islands/' + islandNumber).set(island, function(r) {
    //       console.log('result ', r);
    //       console.log(island);
    //     })
    //   }
    // });
    islands.$add(island).then(function(ref) {
      console.log('ref', ref.key());
      var islandKey = ref.key();
      island = islands.$getRecord(islandKey);
      $state.go('island.playboard', {islandKey:islandKey});
    });
  };
}])
.controller('PlayboardController', 
  ['$scope', '$state', 'APP_CONFIG', '$firebaseObject', '$firebaseArray', '$cookies', '$uibModal',
  function($scope, $state, APP_CONFIG, $firebaseObject, $firebaseArray, $cookies, $uibModal) {


  var CURRENTUSER_COOKIE_KEY = 'cu';
  var islandKey = $state.params.islandKey;
  console.log('Playboard ', islandKey);
  var islandRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey);
  var agentsRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey + '/agents');
  var island = $firebaseObject(islandRef);
  island.$bindTo($scope, 'island');

  Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  };

  var newUser = {
    nickname:'',
    sid: Math.random().toString(36).substr(2, 30)
  };

  try{
    $scope.currentUser = $cookies.getObject(CURRENTUSER_COOKIE_KEY) || newUser;
  }catch(err){
    console.error(err);
    $cookies.remove(CURRENTUSER_COOKIE_KEY);
    $scope.currentUser = {nickname:''};
  }
  //state
  $scope.localState = {
    inputProfile: true,
    agentReady: false
  };


  function isAgentOnIsland(){
    for(var i=$scope.island.agents.length;i--;){
      if($scope.island.agents[i].sid === $scope.currentUser.sid){
        return true;
      }
    }
    return false;
  }

  function canJoin() {
    if($scope.island.agents.length >= $scope.island.capacity && isAgentOnIsland()){
      return false;
    }
    return true;
  }

  //island loaded
  island.$loaded(function() {

    //island state init
    $scope.island.state = $scope.island.state || {
      playing: false,
    };

    //island agents
    
    $scope.island.agents = $firebaseArray(agentsRef);
    $scope.island.agents
    //join check
    if(!canJoin()){
      console.log('agentFull');
      $scope.localState.inputProfile = false;
      $scope.localState.agentFull = true;
      $scope.localState.agentReady = true;
      return false;
    }
  });


  $scope.agentIsReady = function() {
    $scope.currentUser.nickname = $scope.currentUser.nickname.trim();
    if(!$scope.currentUser.nickname){
      alert('請輸入匿稱');
      return false;
    }else{
      $cookies.putObject(CURRENTUSER_COOKIE_KEY, $scope.currentUser);
      $scope.localState.inputProfile = false;
      $scope.localState.agentReady = true;
      if(!canJoin()){
        return false;
        $scope.localState.agentFull = true;
      }
      if(!isAgentOnIsland()){
        $scope.island.agents.$add($scope.currentUser).then(function() {
          //$scope.island.capacity
          if(Object.size($scope.island.agents) >= 1){
            $scope.localState.agentFull = true;
            $scope.island.state.isReady = true;
          }
        });
      }
    }
    return false;
  };

  $scope.startGame = function() {
    console.log('startGame');
  };

  // Math.round(Math.random()*(Math.pow(10,10)-1)).toString().split('')
  $scope.words = [ 
    {name: 'food1', trans: '食物', myScore: 2, oScore: 1},
    {name: 'food2', trans: '食物'},
    {name: 'food3', trans: '食物'},
    {name: 'food4', trans: '食物'},
    {name: 'food5', trans: '食物', myScore: 1, oScore: 1}
    ,
    {name: 'dog1', trans: '狗'},
    {name: 'dog2', trans: '狗'},
    {name: 'dog3', trans: '狗'},
    {name: 'dog4', trans: '狗', myScore: 1, oScore: 1},
    {name: 'dog5', trans: '狗', myScore: 1, oScore: 1},
    {name: 'dog6', trans: '狗'},
    {name: 'mississippi', trans: '狗'},
    {name: 'dog8', trans: '狗'},
    {name: 'dog9', trans: '狗', myScore: 1, oScore: 1},
    {name: 'dog0', trans: '狗'},
    {name: 'cat1', trans: '貓', myScore: 1, oScore: 1},
    {name: 'cat2', trans: '貓'},
    {name: 'cat3', trans: '貓'},
    {name: 'cat4', trans: '貓'},
    {name: 'cat5', trans: '貓', myScore: 1, oScore: 1},
    {name: 'cat6', trans: '貓'},
    {name: 'cat7', trans: '貓'},
    {name: 'cat8', trans: '貓', myScore: 1, oScore: 1},
    {name: 'cat9', trans: '貓', myScore: 1, oScore: 1},
    {name: 'cat0', trans: '貓'},
  ];

  var mapImageWidth = 655;
  var mapImageHeight = 482;
  var displayWidth = Math.min(window.screen.width, 600);
  $scope.mapHeight = displayWidth*mapImageHeight/mapImageWidth;
  $scope.cellHeight = $scope.mapHeight/5;

  $scope.mapCellImageWidth = function(cellIndex) {
    return (cellIndex*(displayWidth/5) % displayWidth)*100/mapImageWidth;
  };

  $scope.mapCellImageHeight = function(cellIndex) {
    return (Math.floor(cellIndex/5)*($scope.mapHeight/5))*100/mapImageHeight;
  };

  $scope.mapCellBackgroundColor = function(word) {
    if(word.myScore > 0){
      return '#ff3';
    }else if(word.myScore < 0){
      return '#111';
    }
  };

  // $scope.showFrontWord = true;
  // $scope.frontWord = $scope.words[0];
  // $scope.frontWord.backgroundHeight = $scope.mapCellImageHeight(1);
  // $scope.frontWord.backgroundWidth = $scope.mapCellImageWidth(1);
  // console.log($scope.frontWord);
  $scope.onMapCellClicked = function(cellIndex, word) {
    console.log(word);
    $scope.frontWord = word;
    $scope.frontWord.backgroundHeight = $scope.mapCellImageHeight(cellIndex);
    $scope.frontWord.backgroundWidth = $scope.mapCellImageWidth(cellIndex);
    $scope.showFrontWord = true;
  };

  $scope.onFrontCellClicked = function() {
    $scope.showFrontWord = false;
  }


}])

// .controller('CreateislandController', 
//   ['$scope', '$state', 'APP_CONFIG', 'DataStore', 
//   function($scope, $state, APP_CONFIG, DataStore) {

// }])
// // .controller('CreateislandController', 
//   ['$scope', '$state', 'APP_CONFIG', 'DataStore', 
//   function($scope, $state, APP_CONFIG, DataStore) {

// }])
// // .controller('CreateislandController', 
//   ['$scope', '$state', 'APP_CONFIG', 'DataStore', 
//   function($scope, $state, APP_CONFIG, DataStore) {

// }])
// // .controller('CreateislandController', 
//   ['$scope', '$state', 'APP_CONFIG', 'DataStore', 
//   function($scope, $state, APP_CONFIG, DataStore) {

// }])
// 
;