angular.module('app.config', [])
  .service('APP_CONFIG', function() {
    return {
      'PROJECT_NAME': 'Midway-Islands',
      'FIREBASE':{
        'URL': 'https://midway-islands.firebaseio.com'
      },
      'TEMPLATE': {
        'LOADING': '<div class="list card padding no-margin rounded"><i class="icon fa fa-spinner fa-pulse fa-3x mai-dark-orange"></i><div>'
      }

    };
  });
