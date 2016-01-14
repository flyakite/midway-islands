angular.module('app.services', [])
.factory('DataStore', function($q, $http, ParseConfiguration) {
  
  function useParseDate(data) {
    // console.dir(data)
    var v;
    for(var k in data){
      // console.dir(k)
      if(data[k].toISOString){
        // console.dir('date ' + k);
        data[k] = {'__type': 'Date', 'iso': data[k].toISOString()};
      }
    }
    return data;
  }

  function _toJSDate (parseObject) {
    for(var k in parseObject){
      if(parseObject[k].__type === 'Date'){
        // console.dir(k)
        parseObject[k] = new Date(parseObject[k].iso);
      }
    }
    return parseObject;
  }

  function toJSDate (parseQueryResult) {
    if(parseQueryResult instanceof Array){
      for(var i=parseQueryResult.length; i--;){
        parseQueryResult[i] = _toJSDate(parseQueryResult[i]);
      }
      return parseQueryResult;
    }else{
      return _toJSDate(parseQueryResult);
    }
  }

  function parseParams (params) {
    //use angular.merge when available
    var headers = {
      'X-Parse-Application-Id': ParseConfiguration.applicationId,
      'X-Parse-REST-API-Key': ParseConfiguration.restKey,
      'X-Parse-Session-Token': ParseConfiguration.sessionToken,
      'Content-Type':'application/json'
    };
    params = params || {};
    params.headers = params.headers || {};
    params.headers = angular.extend(headers, params.headers);
    return params;
  }


  var CLASS_URL = 'https://api.parse.com/1/classes/';
  var FILE_URL = 'https://api.parse.com/1/files/';

  var service = {
    all: function(classname, params) {
      var d = $q.defer();
      $http.get(CLASS_URL + classname, parseParams({params:params})).then(function(result) {
        // console.dir(result.data.results);
        d.resolve(toJSDate(result.data.results));
      },function(err) {
        d.reject(err);
      });
      return d.promise;
    },
    query: function(classname, params) {
      return service.all(classname, params);
    },
    first: function(classname, params) {
      params = params || {};
      params.limit = 1;
      var d = $q.defer();
      service.all(classname, params).then(function(results) {
        d.resolve(results[0]);
      },function(err) {
        d.reject(err);
      });
      return d.promise;
    },
    myFirst: function(classname, user, params) {
      var d = $q.defer();
      params = params || {};
      params.where = params.where || {};
      params.where.user = service.toPointer(user);
      params.limit = 1;
      service.all(classname, params).then(function(results) {
        d.resolve(results[0]);
      },function(err) {
        d.reject(err);
      });
      return d.promise;
    },
    get: function(classname, id, params) {
      var d = $q.defer();
      $http.get(CLASS_URL + classname + '/' + id, parseParams({params:params}))
      .then(function(result) {
        d.resolve(toJSDate(result.data));
      }, function(err) {
        d.reject(err);
      });
      return d.promise;
    },
    create: function(classname, data) {
      // use copy to prevent callback update the data
      var dataCopied = angular.copy(data);
      dataCopied = useParseDate(dataCopied);
      console.dir(dataCopied);
      return $http.post(CLASS_URL + classname, dataCopied, parseParams());
    },
    update: function(classname, id, data) {
      var dataCopied = angular.copy(data);
      dataCopied = useParseDate(dataCopied);
      var d = $q.defer();
      $http.put(CLASS_URL + classname + '/' + id, dataCopied, parseParams())
      .then(function(result) {
        d.resolve(toJSDate(result.data));
      }, function(err) {
        d.reject(err);
      });
      return d.promise;
    },
    /**
     * increase or decrease a field of an object
     * @param  {str} classname 
     * @param  {str} id        
     * @param  {str} field     
     * @param  {int} amount    
     * @return {promise}
     */
    incr: function(classname, id, field, amount) {
      var data = {};
      data[field] = {
        '__op':'Increment',
        'amount': amount
      };
      return $http.put(CLASS_URL + classname + '/' + id, data, parseParams());
    },
    delete: function(classname, id) {
      return $http.delete(CLASS_URL + classname + '/' + id, parseParams());
    },
    /*
     *  options.mimeType
     *  fileData: {base64: data} for image or byte array
     */
    uploadFile: function(fileName, fileData, options) {
      var d = $q.defer();
      var file = new Parse.File(fileName, fileData, options.mimeType);
      file.save().then(function(result) {
        d.resolve(result);
      }, function(err) {
        d.reject(err);
      });
      return d.promise;
    },
    /**
     * Parse object get remote pointer attribute
     * @param  {Pointer} pointer attribute
     * @param  {object}
     */
    getRemote: function(attr, options) {
      var d = $q.defer();
      var self = this;
      options = options || {};
      options.forceRefresh = options.forceRefresh || false;
      console.dir(self);
      console.log(attr);
      console.dir(self.get(attr));
      if(self.get(attr)){
        service.get(self.get(attr).className, self.get(attr).id)
        .then(function(result) {
          self.set(attr, result);
          d.resolve(result);
        }, function(err) {
          d.reject(err);
        });
      }else{
        d.resolve(undefined);
      }
      return d.promise;
    },
    toPointer: function(obj, classname) {
      return {
        '__type': 'Pointer', 
        'className': obj.className || classname,
        'objectId': obj.id || obj.objectId
      };
    }

  };
  return service;
})
;
