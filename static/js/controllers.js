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
  $scope.islandCapacity = 3;

  $scope.createisland = function() {
    console.dir('create');
    var islandNumber = Math.floor(100000 + Math.random()*89999);
    console.dir(islandNumber);
    var island = {
      number: islandNumber,
      capacity: $scope.islandCapacity
    };
    // fireRef.child('/islands/' + islandNumber).once('value', function(result) {
    //   if(result === null){
    //     fireRef.child('/islands/' + islandNumber).set(island, function(r) {
    //       console.dir('result ', r);
    //       console.dir(island);
    //     })
    //   }
    // });
    islands.$add(island).then(function(ref) {
      console.dir('ref', ref.key());
      var islandKey = ref.key();
      island = islands.$getRecord(islandKey);
      
      //init words
      var wordsRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey + '/words');
      var words = $firebaseArray(wordsRef);

      var initWords = [ 
        {id:0, name: 'food1', trans: '食物', isRed:true},
        {id:1, name: 'food2', trans: '食物', isBlue:true},
        {id:2, name: 'food3', trans: '食物', isRed:true, isOccupied:true},
        {id:3, name: 'food4', trans: '食物', isBlue:true, isOccupied:true},
        {id:4, name: 'food5', trans: '食物', isRuined:true},
        {id:5, name: 'dog1', trans: '狗', isRed:true, isRuined:true},
        {id:6, name: 'dog2', trans: '狗', isBlue:true, isRuined:true},
        {id:7, name: 'dog3', trans: '狗'},
        {id:8, name: 'dog4', trans: '狗'},
        {id:9, name: 'dog5', trans: '狗'},
        {id:10, name: 'dog6', trans: '狗'},
        {id:11, name: 'mississippi', trans: '狗'},
        {id:12, name: 'dog8', trans: '狗'},
        {id:13, name: 'dog9', trans: '狗'},
        {id:14, name: 'dog0', trans: '狗'},
        {id:15, name: 'cat1', trans: '貓'},
        {id:16, name: 'cat2', trans: '貓'},
        {id:17, name: 'cat3', trans: '貓'},
        {id:18, name: 'cat4', trans: '貓'},
        {id:19, name: 'cat5', trans: '貓'},
        {id:20, name: 'cat6', trans: '貓'},
        {id:21, name: 'cat7', trans: '貓'},
        {id:22, name: 'cat8', trans: '貓'},
        {id:23, name: 'cat9', trans: '貓'},
        {id:24, name: 'cat0', trans: '貓'},
      ];

      for(var i=0;i<initWords.length;i++){
        words.$add(initWords[i]);
      }

      $state.go('island.playboard', {islandKey:islandKey});
    });
  };

}])
.controller('PlayboardController', 
  ['$scope', '$state', 'APP_CONFIG', '$firebaseObject', '$firebaseArray', '$cookies', '$uibModal',
  function($scope, $state, APP_CONFIG, $firebaseObject, $firebaseArray, $cookies, $uibModal) {


  var CURRENTUSER_COOKIE_KEY = 'cu';
  var CRYPTO_TIME_INTERVAL = 6*1000;
  var INIT_CRYPTO_TIME_INTERVAL = 3*CRYPTO_TIME_INTERVAL;
  var GUESS_TIME_INTERVAL = 10*1000;
  var RED = 0;
  var BLUE = 1;
  var BOMBER = 2;
  var MISSILE_COUNT = 4;
  var GAME_STAGES = [];
  for(var i=0;i<3;i++){
    var j = 3*i;
    GAME_STAGES.push({
      kind:'c-red',
      round: j,
      interval: CRYPTO_TIME_INTERVAL,
      countDown: CRYPTO_TIME_INTERVAL/1000,
      message: '紅方請出題',
      instruction: '紅方正在出題...'
    });
    GAME_STAGES.push({
      kind:'g-red',
      round: ++j,
      interval: GUESS_TIME_INTERVAL,
      countDown: GUESS_TIME_INTERVAL/1000,
      message: '第三方轟炸機請根據紅方提示選擇轟炸目標',
      instruction: '轟炸機正在選擇目標...'
    });
    GAME_STAGES.push({
      kind:'c-blue',
      round: ++j,
      interval: CRYPTO_TIME_INTERVAL,
      countDown: CRYPTO_TIME_INTERVAL/1000,
      message: '藍方請出題',
      instruction: '藍方正在出題...'
    });
    GAME_STAGES.push({
      kind:'g-blue',
      round: ++j,
      interval: GUESS_TIME_INTERVAL,
      countDown: GUESS_TIME_INTERVAL/1000,
      message: '第三方轟炸機請根據藍方提示選擇轟炸目標',
      instruction: '轟炸機正在選擇目標...'
    });
  }
  //initial stage interval longer
  GAME_STAGES[0].interval = INIT_CRYPTO_TIME_INTERVAL;
  GAME_STAGES[0].countDown = INIT_CRYPTO_TIME_INTERVAL/1000;


  var islandKey = $state.params.islandKey;
  console.dir('Playboard ', islandKey);

  //island
  var island = {};
  var islandRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey);
  var island = $firebaseObject(islandRef);
  island.$bindTo($scope, 'island');

  //state
  var islandStateRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey + '/state');
  var state = $firebaseObject(islandStateRef);
  state.$bindTo($scope, 'state');

  //agents
  var agentsRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey + '/agents');
  $scope.agents = [];

  //roles
  var rolesRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey + '/roles');
  $scope.roles = $firebaseArray(rolesRef);
  $scope.roles.$loaded(function() {
    if($scope.roles.length == 0){
      console.log('init roles');
      var initRoles = [
        {id:0, name: '紅方', isRed: true, score:9},
        {id:1, name: '藍方', isBlue: true, score:9},
        {id:2, name: '第三方', isBomber: true, score:0},
      ];
      for(var i=0;i<initRoles.length;i++){
        $scope.roles.$add(initRoles[i]);
      }
    }
  });

  var logsRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey + '/logs');
  $scope.logs = $firebaseArray(logsRef);

  // rolesRef.on('value', function(snapshot) {
  //   var roles = snapshot.val()
  //   if(roles !== null){
  //     $scope.roles = roles;
  //   }else{
  //   }
  // });

  //words
  var wordsRef = new Firebase(APP_CONFIG.FIREBASE.URL + '/islands/' + islandKey + '/words');
  $scope.words = $firebaseArray(wordsRef);
  // wordsRef.on('value', function(snapshot) {
  //   if(snapshot.val() !== null){
  //     $scope.words = snapshot.val();
  //   }else{
  //     console.error('no words');
  //   }
  // });

  Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
    }
    return size;
  };

  var newUser = {
    nickname:'',
    sid: Math.random().toString(36).substr(2, 30),
  };
  try{
    var tu = $cookies.getObject(CURRENTUSER_COOKIE_KEY) || newUser;
    $scope.currentUser = {
      nickname: tu.nickname,
      sid: tu.sid
    };
    console.log($scope.currentUser);
  }catch(err){
    console.error(err);
    $cookies.remove(CURRENTUSER_COOKIE_KEY);
    $scope.currentUser = {nickname:''};
  }
  
  //init state
  $scope.localState = {
    inputProfile: true,
    agentReady: true,
    stageIndex: 0
  };

  function islandInit () {
    console.log('island init');
    console.log(GAME_STAGES[0]);
    if(!$scope.state || !$scope.state.currentStage){
      $scope.state = {
        allPlayerJoined: false,
        allRoleAssigned: false,
        currentState: '',
        currentStage: GAME_STAGES[0]
      };
    }
    // $scope.island. = $scope.island.currentState || '';
    // $scope.island.currentStage = $scope.island.currentStage || GAME_STAGES[0];
    console.dir($scope.state);
  }


  function indexOfAgentOnIsland(){
    console.dir('indexOfAgentOnIsland');
    for(var i=$scope.agents.length;i--;){
      console.dir('Agent', $scope.agents[i]);
      if($scope.agents[i].sid === $scope.currentUser.sid){
        console.dir('agent is on island');
        return i;
      }
    }
    return -1;
  }

  function canJoin() {
    if($scope.agents.length >= $scope.island.capacity && indexOfAgentOnIsland() == -1){
      return false;
    }
    return true;
  }

  
  //island loaded and bound to $scope
  state.$loaded(function() {
    
    islandInit();
    console.dir($scope.state.currentStage);

    //island agents
    $scope.agents = $firebaseArray(agentsRef);
    $scope.agents.$loaded(function() {
      console.dir($scope.island);
      //join check
      if(!canJoin()){
        console.log('agentFull');
        $scope.localState.inputProfile = false;
        $scope.localState.agentFull = true;
        $scope.localState.agentReady = true;
        return false;
      }else{
        console.log('canjoin');
        console.dir($scope.currentUser);
        var iai = indexOfAgentOnIsland();
        if(iai != -1){
          console.log('on island');
          $scope.localState.myAgentKey = $scope.agents.$keyAt(iai);
          $scope.currentUser = $scope.agents.$getRecord($scope.localState.myAgentKey);
          assignHost();
        }
      }
    });

    //init game stages
    $scope.state.stageIndex = 0;
    // for(var i=1;i<=3;i++){
    //   GAME_STAGES.push({
    //     kind: 'crypto',
    //     round: i,
    //     interval: CRYPTO_TIME_INTERVAL
    //   });
    //   for(var j=1;j<=island.capacity;j++){
    //     GAME_STAGES.push({
    //       kind: 'guess',
    //       round: i,
    //       turn: j,
    //       interval: GUESS_TIME_INTERVAL
    //     });
    //   }
    // };

    if(!$scope.state || !$scope.state.currentStage){
      islandInit();
    }
    $scope.localState.countDown = $scope.state.currentStage.interval/1000;

    state.$watch(function() {
      console.log('state changed');
      localStartGame();
      if($scope.state.stageIndex > $scope.localState.stageIndex){
        console.log('watched Stage Changed');
        if($scope.state.stageIndex >= GAME_STAGES.length){
          clearTimeout(gameLoopTimeout);
          endGame();
          return
        }
        $scope.localState.stageIndex = $scope.state.stageIndex;
        showMessage(GAME_STAGES[$scope.state.stageIndex].message);
        if($scope.currentUser.role.isBomber && 
          ['g-red', 'g-blue'].indexOf(GAME_STAGES[$scope.state.stageIndex].kind) !== -1){
          $scope.localState.missileCount = MISSILE_COUNT;
        }
      }
    });
    localStartGame();
  });

  function localStartGame () {
    if($scope.state.currentState == 'started' && !$scope.localState.gameStarted){
      showMessage(GAME_STAGES[0].message);
      console.log('localStartGame');
      $scope.localState.gameStarted = true;
      gameLoop();
    }
  }

  function endGame() {
    console.log('endGame');
    updateScore();
    // var maxScore=0, maxI=0, maxAgent;
    // for(var i=$scope.roles.length;i--;){
    //   if($scope.roles[i].score > maxScore){
    //     maxScore = $scope.roles[i].score;
    //     maxI = i;
    //   }
    // }
    var msg = '';
    for(var j=0;j<$scope.agents.length;j++){
      msg += ' ' + $scope.agents[j].nickname + ' ' +
      $scope.roles[$scope.agents[j].role.id].score + '分';
    }
    showMessage('遊戲結束了' +  msg);
  }

  var setStage = function() {
    if($scope.state.stageIndex >= GAME_STAGES.length){
      return
    }
    console.log('currentState ' + $scope.state.stageIndex);  
    $scope.state.currentStage = GAME_STAGES[$scope.state.stageIndex];
    if(GAME_STAGES[$scope.state.stageIndex].countDown > 0){
      $scope.localState.countDown = GAME_STAGES[$scope.state.stageIndex].countDown--;
      console.log($scope.state.currentStage.kind, $scope.localState.countDown);
    }else{
      console.log('change stage');
      if($scope.currentUser.isHost){
        $scope.state.stageIndex++;
      }
      $scope.localState.countDown = $scope.state.currentStage.interval/1000;
    }
  };

  var doStage = function() {
    // console.log('doStage ', $scope.state.currentStage.kind);
    // if(['c-red', 'c-blue']indexOf($scope.state.currentStage.kind)){
    //   doCryptoStage();
    // }else if(['g-red', 'g-blue']indexOf($scope.state.currentStage.kind)){
    //   doGuessStage();
    // }
  };

  // var doCryptoStage = function() {
  //   console.dir('doCryptoStage');

  // };

  // var doGuessStage = function() {
  //   console.dir('doGuessStage');
  // };
  var gameLoopTimeout;
  var gameLoop = function() {

    setStage();
    doStage();

    gameLoopTimeout = setTimeout(function() {
      gameLoop();
      $scope.$apply();
    }, 1000);
  };

  var assignHost = function() {
    console.log('assignHost');
    if(!$scope.localState.myAgentKey){
      console.error('no $scope.localState.myAgentKey');
    }
    if($scope.agents.$indexFor($scope.localState.myAgentKey) === 0){
      console.log('first player isHost');
      $scope.currentUser.isHost = true;
    }else{
      $scope.currentUser.isHost = false;
    }
  };

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
      var i = indexOfAgentOnIsland();
      if(i !== -1){
        // agent on island
        $scope.localState.myAgentKey = $scope.agents.$keyAt(i);
        assignHost();
      }else{
        // agent not on island
        $scope.agents.$add($scope.currentUser).then(function(ref) {
          console.dir($scope.agents);
          // console.dir($scope.agents.$indexFor(0));
          $scope.localState.myAgentKey = ref.key();
          // if(Object.size(agents) >= 1){
          if($scope.agents.length == 1){ //$scope.island.capacity){
            //island is full
            $scope.localState.agentFull = true;
            if(!$scope.state){
              islandInit();
            }
            $scope.state.allPlayerJoined = true;
            island.$save(); //explicitly trigger change event
          }
          assignHost();
        });
        $scope.agents.$save();
      }
      
    }
    return false;
  };

  var showMessageTimeout;
  function showMessage(text) {
    console.log('show ', text);
    clearTimeout(showMessageTimeout);
    $scope.popupMessage = text;
    $scope.showPopupMessage = true;
    showMessageTimeout = setTimeout(function() {
      $scope.showPopupMessage = false;
    }, 5000)
  }

  $scope.hideMessage = function() {
    clearTimeout(showMessageTimeout);
    $scope.showPopupMessage = false;
  }

  $scope.pickRole = function(role) {
    console.dir('pickRole');
    console.dir(role);
    console.dir($scope.agents);
    for(var i = $scope.agents.length;i--;){
      console.dir($scope.agents[i]);
      if($scope.agents[i].role && $scope.agents[i].role.id == role.id){
        showMessage(role.name + '已經被選走，請選擇其他角色');
        return
      }
    }
    // var r = $scope.roles.$getRecord(role.$id)
    // r.user = $scope.currentUser
    // $scope.roles.$save(r);

    // rolesRef.child(role.id).update({
    //   user: $scope.currentUser
    // });

    console.log($scope.localState.myAgentKey);
    if($scope.localState.myAgentKey){
      var me = $scope.agents.$getRecord($scope.localState.myAgentKey);
      me.role = role;
      $scope.agents.$save(me);
    }
    $scope.currentUser.role = role;
  };

  $scope.startGame = function() {
    console.log('startGame');
    var checkRolesArrangement = function() {
      var j, 
        // roleIDs = [0,1,2];
        roleIDs = [0];
      for(var i = $scope.agents.length; i--;){
        j = roleIDs.indexOf($scope.agents[i].role.id);
        if(j == -1){
          return false;
        }else{
          roleIDs.splice(i,1);
        }
      }
      return true;
    };
    
    if(!checkRolesArrangement()){
      showMessage('每位玩家要選一個對應的角色，角色不可重複');
      // return;
    }
    // console.dir('startGame', $scope.island, island);
    $scope.state.currentState = 'started';
    island.$save(); //call $save explicitly will trigger $watch
  };



  var mapImageWidth = 655;
  var mapImageHeight = 482;
  var displayWidth = Math.min(window.screen.width, 600);
  $scope.mapHeight = displayWidth*mapImageHeight/mapImageWidth;
  $scope.cellHeight = $scope.mapHeight/5;

  $scope.mapCellImageWidth = function(cellIndex) {
    return (cellIndex*(displayWidth/5) % displayWidth)*120/displayWidth;
  };

  $scope.mapCellImageHeight = function(cellIndex) {
    return (Math.floor(cellIndex/5)*($scope.mapHeight/5))*125/mapImageHeight;
  };

  $scope.mapCellBackgroundColor = function(word) {
    if(word.isRed){
      return '#f20';
    }else if (word.isBlue){
      return '#22f';
    }
  };

  $scope.frontWord = {};
  // $scope.showFrontWord = true;
  // $scope.frontWord = $scope.words[0];
  // $scope.frontWord.backgroundHeight = $scope.mapCellImageHeight(1);
  // $scope.frontWord.backgroundWidth = $scope.mapCellImageWidth(1);
  // console.dir($scope.frontWord);
  $scope.onMapCellClicked = function(cellIndex, word) {
    console.dir(word);
    $scope.frontWord = word;
    $scope.frontWord.backgroundHeight = $scope.mapCellImageHeight(cellIndex);
    $scope.frontWord.backgroundWidth = $scope.mapCellImageWidth(cellIndex);
    $scope.showFrontWord = true;
    return false;
  };

  $scope.onFrontCellClicked = function() {
    $scope.showFrontWord = false;
    return false;
  };

  $scope.fireInTheHole = function(word) {
    console.log('fireInTheHole');
    console.dir(word);
    if(word.isRuined || word.isOccupied){
      console.error('Cannot be bombed twice.');
      return
    }
    if(['g-red', 'g-blue'].indexOf($scope.state.currentStage.kind) == -1){
      console.error('Not a guessing stage ', $scope.state.currentStage.kind);
      return
    }
    var message = $scope.currentUser.nickname + ' 選擇轟炸 ' + word.name;
    if(word.isRed && $scope.state.currentStage.kind == 'g-red'){
      word.isRuined = true;
      $scope.words.$save(word);
      $scope.roles[RED].score--;
      $scope.roles.$save();
      $scope.state.stageIndex++;
      message += ' （這是紅方的領地呀！ 這回合結束了）';
    }else if(word.isBlue && $scope.state.currentStage.kind == 'g-blue'){
      word.isRuined = true;
      $scope.words.$save(word);
      $scope.roles[BLUE].score--;
      $scope.roles.$save();
      $scope.state.stageIndex++;
      message += ' （這是藍方的領地呀！ 這回合結束了）';
    }else if(word.isRed && $scope.state.currentStage.kind == 'g-blue'){
      word.isOccupied = true;
      $scope.words.$save(word);
      $scope.roles[RED].score--;
      $scope.roles[BLUE].score += 0.5;
      $scope.roles[BOMBER].score += 0.5;
      $scope.roles.$save();
      message += ' （成功佔領這塊紅方區域！）';
    }else if(word.isBlue && $scope.state.currentStage.kind == 'g-red'){
      word.isOccupied = true;
      $scope.words.$save(word);
      $scope.roles[BLUE].score--;
      $scope.roles[RED].score += 0.5;
      $scope.roles[BOMBER].score += 0.5;
      $scope.roles.$save();
      message += ' （成功佔領這塊藍方區域！）';
    }else{
      word.isRuined = true;
      $scope.state.stageIndex++;
      message += ' （這是一個平民區！ 這回合結束了）';
    }
    $scope.logs.$add({
      message: message
    });
    showMessage(message);
    $scope.localState.missileCount--;
    if($scope.localState.missileCount == 0){
      $scope.state.stageIndex++;
    }
    $scope.showFrontWord = false;
    return false;
  };

  function updateScore () {
    var word, red=0, blue=0, bomber=0;
    for(var i=$scope.words.length;i--;){
      word = $scope.words[i];
      if(word.isRed && word.isOccupied){
        blue += 0.5;
        bomber += 0.5;
      }else if(word.isBlue && word.isOccupied){
        red += 0.5;
        bomber += 0.5;
      }else if(word.isRed && !word.isRuined){
        red++;
      }else if(word.isBlue && !word.isRuined){
        blue++;
      }
    }
    $scope.roles[RED].score = red;
    $scope.roles[BLUE].score = blue;
    $scope.roles[BOMBER].score = bomber;
  }

  $scope.telegraph = {
    message: ''
  };

  $scope.sendTelegraph = function() {
    console.log('sendTelegraph', $scope.telegraph.message);
    if($scope.localState.countDown>5){
      $scope.state.stageIndex++;
    }

    $scope.logs.$add({
      message:$scope.currentUser.nickname + ' 發送了作戰提示： ' + $scope.telegraph.message
    });

    $scope.telegraph.message = '';
  };

  $scope.giveUpMissile = function() {
    $scope.state.stageIndex++;
    return false;
  };

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