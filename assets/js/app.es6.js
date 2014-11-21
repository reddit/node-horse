import * as querystring from 'querystring';

import * as React from 'react';
import * as q from 'q';
import * as $ from 'jquery';

global.jQuery = global.$ = $;

import 'bootstrap';

import App from '../../src/app';
import config from '../../src/config';
import plugins from '../../src/plugins';

// Server uses express sessions; on the client, we'll persist state in memory.
App.prototype.getState = function(s) {
  if (s) {
    return this.state[s];
  }

  return this.state;
}

App.prototype.setState = function(s, v) {
  this.state[s] = v;
  return v;
}

App.prototype.resetState = function(o) {
  this.state = o || {};
}

function buildRequest (url, app) {
  var req = {};
  req.url = url;
  req.method = 'GET';
  req.renderSynchronous = false;

  req.query = querystring.parse(url.split('?')[1] || '');

  req.headers = {};
  req.session = {};

  return req;
}

function changeUrl(href, mountPoint, app, initial) {
  var req = buildRequest(href, app);
  var defer = q.defer();

  if (initial) {
    req.props = app.getState();
  }

  defer.promise.then(function(res) {
    React.render(res.body, mountPoint);
  }).fail(function(res) {
    console.log('failure', arguments);
  });

  app.route(req, defer);
}

$(function() {
  var plugin, p;

  var app = new App(config);

  // Reset to window bootstrapping data
  app.resetState(window.bootstrap);

  if (plugins) {
    for (p in plugins) {
      plugin = plugins[p];
      plugin.register(app);
    }
  }

  var history = window.history || window.location.history;
  var mountPoint = document.getElementById('app-container');

  if (history) {
    $('body').on('click', 'a', function(e) {
      var $link = $(this);
      var href = $link.attr('href');

      // If it has a target=_blank, or an 'external' data attribute, or it's
      // an absolute url, let the browser route rather than forcing a capture.
      if (
        ($link.attr('target') || $link.attr('data-no-route')) ||
        href.indexOf('//') > -1
      ) {
        return;
      }

      e.preventDefault();

      if (href === document.location.pathname) {
        return;
      }

      history.pushState(null, null, href);

      changeUrl(href, mountPoint, app);
    });

    $(window).on('popstate', function(e) {
      changeUrl(location.pathname, mountPoint, app);
    });

    changeUrl(document.location.pathname, mountPoint, app, true);
  }
});
