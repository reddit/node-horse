import { EventEmitter } from 'events';

// Import a simple router that works anywhere.
import Router from 'koa-router';

// Custom errors for fun and profit.
import RouteError from './routeError';

import co from 'co';

class App {
  constructor (config={}) {
    this.config = config;

    // The router listens to web requests (or html5 history changes) and fires
    // callbacks registered by plugins.
    this.router = new Router();
    this.emitter = new EventEmitter();

    this.startRequest = config.startRequest || [];
    this.endRequest = config.endRequest || [];

    this.plugins = [];
  }

  // A nicer-looking way to load config values.
  getConfig (c) {
    return this.config[c];
  }

  // Accepts routes / history changes, and forwards on the req object and
  // the response (a `defer` object). The last param, `function`, can be safely
  // ignored - it's fired after handling.
  route (ctx) {
    this.emit('route:start', ctx);
    var middleware = this.router.routes().call(ctx);
    var app = this;

    var match = this.router.match(ctx.path).filter((r) => {
      return ~r.methods.indexOf(ctx.method);
    });

    if (!match.length) {
      return new Promise(function(resolve) {
        app.error(new RouteError(ctx.path), ctx, app);
        resolve();
      });
    }

    return co(function * () {
      if (app.startRequest.length) {
        app.startRequest.forEach(function(f) {
          // pre-set it for the startRequest call
          ctx.route = match[0];
          return f.call(ctx, app);
        });
      }

      yield* middleware;

      if (app.endRequest.length) {
        app.endRequest.forEach(function(f) {
          return f.call(ctx, app);
        });
      }
    }).then(() => {
      this.emit('route:end', ctx);
    }, (err) => {
      if(this.config.debug) {
        console.log(err, err.stack);
      }

      this.error(err, ctx, app);
    }.bind(this));
  }

  registerPlugin (plugin) {
    if (this.plugins.indexOf(plugin) === -1) {
      this.plugins.push(plugin);
    }
  }

  emit (...args) {
    this.emitter.emit.apply(this.emitter, args);
  }

  on (...args) {
    this.emitter.on.apply(this.emitter, args);
  }

  off (...args) {
    this.emitter.removeListener.apply(this.emitter, args);
  }

  error (err, ctx, app) {
    var status = err.status || 500;
    var message = err.message || 'Unkown error';
    var url = '/' + status;

    if (ctx.request.url !== url) {
      ctx.set('Cache-Control', 'no-cache');
      ctx.originalUrl = ctx.originalUrl || ctx.request.url;
      ctx.path = url;

      this.route(ctx);
    } else {
      // Critical failure! The error page is erroring! Abandon all hope
      console.log(err);
    }
  }
}

export default App;
