// The HTTP server configuration.
// This is the only code (besides gulpfile / index) that is *not* run on the
// client.

import q from 'q';
import _ from 'lodash';

// Express and middleware
import express from 'express';
import favicon from 'serve-favicon';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import session from 'express-session';
import csurf from 'csurf';

// For rendering
import React from 'react';

// Plugins
import plugins from './plugins';

// The core
import App from './app';
import oauth from './oauth';

class Server {
  constructor (config) {
    // Bind all the things
    this.render = this.render.bind(this);
    this.error = this.error.bind(this);

    // Intantiate a new App instance (React middleware)
    var app = new App(config);
    var server = express();
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
      secret: app.config.cookieSecret,
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

    var error = this.error;
    var render = this.render;

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

      res.render = function(response) {
        render(response, req, res, app);
      };

      res.error = function(response, req, res, app) {
        error(response, req, res, app);
      };

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

    this.server = server;
    this.app = app;
    this.router = router;
  }

  start () {
    // Register the plugins - some plugins mutate other react components, so they
    // need an instance of our App passed in
    var plugin, p;

    if (plugins) {
      for (p in plugins) {
        plugin = plugins[p];
        plugin.register(this.app);
      }
    }

    // Listen to a port and shout it to the world.
    this.server.listen(this.app.config.port);
    console.log('listening on ' + this.app.config.port);
  }

  // Set up the ability to inject bootstrapping data, so the client doesn't have
  // to re-hit the server for initialization data
  injectBootstrap (body, props) {
    var bodyIndex = body.lastIndexOf('</body>');
    var template = '<script>var bootstrap=' + JSON.stringify(props) + '</script>';
    return body.slice(0, bodyIndex) + template + body.slice(bodyIndex);
  }

  // The success render function
  render (response, req, res, app) {
    var status = response.status || 200;
    var body = response.body || '';
    var props = response.props;
    var Layout = response.layout;

    var error = this.error;
    var injectBootstrap = this.injectBootstrap;

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
        console.log(e);
        return this.error({
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

  error (response, req, res, app) {
    var status = response.status || 500;
    var message = response.message || 'Unkown error';

    var error = response.error;

    if (this.app.config.debug && response.error) {
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
}

export default Server;
