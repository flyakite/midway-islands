angular.module('app.services', [])
.service('AppService', ['APP_CONFIG', function(APP_CONFIG) {
   
  var service = {
    showLoading: function() {
      var el = document.getElementById('loading');
      el.className = 'loading-active';
    },
    hideLoading: function() {
      var el = document.getElementById('loading');
      el.className = 'loading-inactive';
    }
  };
  return service;
}])