import App from '../../src/app';
import config from '../../src/config';
import plugins from '../../src/plugins';

var app = new App(config);

/*
*on html5 state change, function() {
  // build req object

  var defer = q.defer();

  defer.promise.then(function(response) {
    var status = response.status || 200;
    var body = response.body || '';

    if (body) {
      if (typeof body === 'object') {
        // mount body
      }
    } else {
      status = 204;
    }
  }).fail(function(response) {
    if (typeof body === 'object') {
      // mount body
    } else {
      // handle error
    }
  });

  // build request object and pass in defer
  app.route(req, defer);
});
 * */
