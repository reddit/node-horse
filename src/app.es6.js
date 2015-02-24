import { EventEmitter } from 'events';

// Import a simple router that works anywhere.
import Router from 'express-router-pulled-out';

// Custom errors for fun and profit.
import RouteError from './routeError';

class App {
  constructor (config) {
    this.config = config;

    this.state = {};

    // The router listens to web requests (or html5 history changes) and fires
    // callbacks registered by plugins.
    this.router = new Router();

    this.emitter = new EventEmitter();
  }

  // A nicer-looking way to load config values.
  getConfig (c) {
    return this.config[c];
  }

  // Accepts routes / history changes, and forwards on the req object and
  // the response (a `defer` object). The last param, `function`, can be safely
  // ignored - it's fired after handling.
  route (req, res, next) {
    this.emit('route:start', req);

    try {
      this.router.handle(req, res, next || App.done.bind(req));
    } catch(e) {
      res.error(e, req, res, this);
    }

    this.emit('route:end', req);
  }

  registerPlugin (plugin) {
    if (this.plugins.indexOf(plugin) === -1) {
      this.plugins.push(plugin);
    }
  }

  emit (...args) {
    this.emitter.emit.apply(this, args);
  }

  on (...args) {
    this.emitter.on.apply(this, args);
  }

  static done (err) {
    if (typeof err !== 'undefined') {
      if (err === null) {
        throw new RouteError(this.url);
      } else {
        throw(err);
      }
    }
  }
}

export default App;
