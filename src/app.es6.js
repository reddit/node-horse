// Import `mutate`, which has the logic for allowing plugins to mutate other
// plugins' React elements.
import { mutate } from './mutate';

// Import a generic, polymor
import * as Router from 'express-router-pulled-out';

// Import the api instance; we're going to share an instance between the
// plugins.
import { v1 as V1Api } from 'snoode';

import RouteError from './routeError';

function done (err) {
  if (typeof err !== 'undefined') {
    if (err === null) {
      throw new RouteError(this.url);
    } else {
      throw(err);
    }
  }
};

class App {
  constructor (config) {
    this.config = config;

    this.state = {};

    this.mutators = config.mutators || {};

    // The router listens to web requests (or html5 history changes) and fires
    // callbacks registered by plugins.
    this.router = new Router();

    // Set up two APIs (until we get non-authed oauth working).
    this.nonAuthAPI = new V1Api({
      userAgent: config.userAgent,
      origin: config.nonAuthAPIOrigin,
    });

    this.oauthAPI = new V1Api({
      userAgent: config.userAgent,
      origin: config.authAPIOrigin,
    });
  }

  // A nicer-looking way to load config values.
  getConfig (c) {
    return this.config[c];
  }

  // Accepts routes / history changes, and forwards on the req object and
  // the response (a `defer` object). The last param, `function`, can be safely
  // ignored - it's fired after handling.
  route (req, res, next) {
    return this.router.handle(req, res, next || done.bind(req));
  }

  // Allow plugins to register mutators that change how React elements render.
  registerMutators (elementName, mutators) {
    this.mutators[elementName] = this.mutators[elementName] || [];
    this.mutators[elementName] = this.mutators[elementName].concat(mutators);
  }

  // React elements in plugins should call `mutate` as a response to their
  // Factory methods so that registered mutators can wrap the elements.
  mutate (elementName, component) {
    var args = this.mutators[elementName];

    if (args && args.length) {
      args.splice(0, 0, component);
      return mutate.apply(component, args);
    }

    return component;
  }

  // Return the proper API based on session information.
  V1Api (req) {
    if (req.session.token){
      return this.oauthAPI;
    }

    return this.nonAuthAPI;
  }
}

export default App;
