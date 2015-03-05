import { EventEmitter } from 'events';

// Import a simple router that works anywhere.
import Router from 'koa-router';

// Custom errors for fun and profit.
import RouteError from './routeError';

import co from 'co';

class App {
  constructor (config) {
    this.config = config;

    // The router listens to web requests (or html5 history changes) and fires
    // callbacks registered by plugins.
    this.router = new Router();
    this.emitter = new EventEmitter();

    this.plugins = [];
  }

  // A nicer-looking way to load config values.
  getConfig (c) {
    return this.config[c];
  }

  // Accepts routes / history changes, and forwards on the req object and
  // the response (a `defer` object). The last param, `function`, can be safely
  // ignored - it's fired after handling.
  route (ctx, next) {
    this.emit('route:start', ctx);
    var middleware = this.router.routes().call(ctx);
    var app = this;

    co(function * () {
      yield* middleware;
    }).then(function () {
      next.call(ctx);
      app.emit('route:end', ctx);
    }, function (err) {
      return app.error(new RouteError(ctx.path), ctx, app, next);
    });
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

  error (err, ctx, app, next) {
    var status = err.status || 500;
    var message = err.message || 'Unkown error';

    var reroute = '/' + status;
    var url = '/' + status;

    if (ctx.request.url !== url) {
      ctx.redirect(status, url);
      if(next) next();
    } else {
      // Critical failure! The error page is erroring! Abandon all hope
      console.log(err);
    }
  }
}

export default App;
