// The HTTP server configuration.
// This is the only code (besides gulpfile / index) that is *not* run on the
// client.

import * as q from 'q';
import * as _ from 'lodash';

// Express and middleware
import * as express from 'express';
import * as favicon from 'serve-favicon';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import * as session from 'express-session';
import * as csurf from 'csurf';

// For rendering
import * as React from 'react';

// Plugins
import plugins from './plugins';

// The core
import App from './app';
import oauth from './oauth';

// App config
import config from './config';
// Import built-asset manifests for passing to layouts
import * as jsManifest from '../build/js/client-manifest.json';
import * as cssManifest from '../build/css/css-manifest.json';

// Then merge them into a single object for ease of use later
config.manifest = {};
Object.assign(config.manifest, jsManifest, cssManifest);

// Private, server-only config that we don't put in config.js, which is shared
config.liveReload = process.env.LIVERELOAD || true;
config.cookieSecret = process.env.SWITCHAROO_COOKIE_SECRET || 'snoo';
config.oauth = {
  clientId: process.env.OAUTH_CLIENT_ID || '',
  secret: process.env.OAUTH_SECRET || '',
};

// Intantiate a new App instance (React middleware)
var app = new App(config);

// Register the plugins - some plugins mutate other react components, so they
// need an instance of our App passed in
var plugin, p;

if (plugins) {
  for (p in plugins) {
    plugin = plugins[p];
    plugin.register(app);
  }
}

// Instantiate the express web server instance
var server = express();

// Instantiate a new express router
var router = express.Router();

// Set the port that the webserver should run on
server.set('port', app.config.port);

// Configure the webserver, and set up middleware
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
  extended: true,
}));

server.use(compression());
server.use(cookieParser());

server.use(session({
  secret: config.cookieSecret,
  resave: true,
  saveUninitialized: true,
  httpOnly: true,
  cookie: {
    maxAge: 60000
  },
  rolling: true,
}));

server.use(csurf());

server.use(favicon(__dirname + '/../public/favicon.ico'));

// Set up static routes for built (and unbuilt, static) files
router.use(express.static(__dirname + '/../build'));
router.use(express.static(__dirname + '/../public'));
router.use(express.static(__dirname + '/../lib/snooboots/dist'));

// Set up oauth routes
oauth(app, router);

// Set up the ability to inject bootstrapping data, so the client doesn't have
// to re-hit the server for initialization data
function injectBootstrap(body, props) {
  var bodyIndex = body.lastIndexOf('</body>');
  var template = '<script>var bootstrap=' + JSON.stringify(props) + '</script>';
  return body.slice(0, bodyIndex) + template + body.slice(bodyIndex);
}

// The success render function
function render (response, req, res, app) {
  var status = response.status || 200;
  var body = response.body || '';
  var props = response.props;
  var Layout = response.layout;

  if (body) {
    try {
      // If it's an object, it's probably React.
      if (React.isValidElement(body)) {
        if (Layout) {
          body = <Layout {...props}>{body}</Layout>;
        }

        body = React.renderToStaticMarkup(body);
        body = injectBootstrap(body, props);
      }
    } catch (e) {
      return error({
        status: 500,
        message: e.toString(),
        error: e,
      }, req, res, app);
    }
  } else {
    status = 204;
  }

  res.status(status).send(body);
}

function error (response, req, res, app) {
  var status = response.status || 500;
  var message = response.message || 'Unkown error';

  var error = response.error;

  if (config.debug && response.error) {
    if (response.error.fileName) {
      message += '\n' + response.error.fileName;
    }

    if (response.error.stack) {
      message += '\n' + response.error.stack;
    }

    console.log(message);

    res.status(status).send(message);
  } else {
    var reroute = '/' + status;

    if (req.url !== reroute) {
      req.status = status;
      req.url = '/' + status;

      return app.route(req, res);
    } else {
      console.log(response);
      res.status(500).send('Yo dawg, I heard you liked errors, so I errored while rendering your error page');
    }
  }
}

// Set up the router to listen to ALL requests not caught by the static
// directive aboves, and send them into the `App` React middleware instance.
router.use(function(req, res, next) {
  // Gather all data before rendering.
  req.renderSynchronous = true;

  // Only cache unauthed requests
  req.useCache = !(req.session && req.session.token);

  // Make a copy of response that can be sent into the polymorphic `app`.
  // Overwrite send with our server's send.
  var response = res;
  res.render = function(response) { render(response, req, res, app); };
  res.error = function(response, req, res, app) { error(response, req, res, app); };

  req.csrf = req.csrfToken();

  try {
    app.route(req, response);
  } catch (e) {
    // Handle if custom type (like routeerror)
    error({
      message: e.message,
      stack: e.stack || '',
      error: e.error || e,
      status: e.status || 500,
    }, req, res, app);
  }
});

// Finally, listen to the router on `/` (all requests).
server.use('/', router);

// Listen to a port and shout it to the world.
server.listen(config.port);
console.log('listening on ' + config.port);
