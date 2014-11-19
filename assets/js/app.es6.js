import * as querystring from 'querystring';

import * as React from 'react';
import * as q from 'q';
import * as $ from 'jquery';

import App from '../../src/app';
import config from '../../src/config';
import plugins from '../../src/plugins';

function buildRequest (url, app) {
  var req = {};
  req.url = url;
  req.method = 'GET';

  req.query = querystring.parse(url.split('?')[1] || '');

  req.headers = {
  };

  req.session = {
  };

  return req;
}

function changeUrl(href, mountPoint, app) {
  var req = buildRequest(href, app);
  var defer = q.defer();

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
        ($link.attr('target') || $link.attr('data-external')) ||
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
  }
});
