horse
=====

[![Build Status](https://travis-ci.org/reddit/horse.svg)](https://travis-ci.org/reddit/horse)

horse is a couple of helper classes that can be used to help you build isomorphic
applications for io.js / node. It abstracts routing and rendering helpers so
that you can plug in a rendering system, bind links, and have an application
that works anywhere.

The vast bulk of your application will live in your routes file (`routes.jsx`
in the example below), your API library, and your views - and will be shared
between the server and the client. horse's job is to get out of the way so that
you don't care where the code is running, and yet you get both server-side and
client-side rendering.

A Brief Overview
----------------

```
 ======================================
            Your App

 +---------+          +---------------+
 |   koa   |          | html5 history |
 +---------+          |     api       |
    |                 +---------------+
   req                      req
    |                        |        render and
    \                        /    wait for new route
     ------------------------            event
                |                          ^
                v                          |
 ======================================    |
         +--------------+                  |
         | horse/App.js |                  |
         +--------------+                  |
                |                          |
                v                          |
 ====================================      |
         Your App's Routes                 |
                                           |
        +---------------+                  |
        | route handler | -> yield { body: reactElement }
        |               | -> throw MissingAuthenticationError();
        +---------------+
```

The App has an instance of an Express-like request router that it uses to map
requests to the appropriate handling function, and is run on both the client-
and server- side. It's meant to abstract just enough boilerplate out of the
way so that you can do your own custom stuff.

An example usage might be like: (es6 incoming)

`routes.jsx`

```javascript
// This is used both client- and server- side, and simply sets up an app with
// routes; in this case, returning React elements.

import Layout from '../layouts/layout.jsx';
import Index from '../pages/index.jsx';

function setupRoutes(app) {
  app.router.get('/', function *() {
    this.layout = Layout;

    var user = yield db.getUser(1);
    this.props = { user };

    this.body = <Index {...this.props} />;
  });
}

export default setupRoutes;
```


`server.es6.js`

```javascript
import koa from 'koa';
import React from 'react';

import {App} from 'horse';
import setupRoutes from './setupRoutes';

var server = koa();

var app = new App();
setupRoutes(app);

server.use(function *(next) {
  yield app.route(this, function () {
    var Layout = this.layout;

    this.body = react.renderToStaticMarkup(
      <Layout>{this.body}</Layout>
    );
  });
}
```

`client.es6.js`

```javascript
import React from 'react';
import {ClientApp} from 'horse';

import setupRoutes from './setupRoutes';

import jQuery as $ from 'jquery';

var app = new ClientApp();
setupRoutes(app);

var $mountPoint = document.getElementById('app-container');

$(function() {
  $('body').on('click', 'a', function(e) {
    var $link = $(this);

    var ctx = app.buildContext($link.attr('href'));
    yield app.route(ctx);

    React.render(ctx.body, $mountPoint);
  });
});

```


Final Notes
-----------

Default events:

```
app.on('route:start', function(ctx){})
app.on('route:end', function(ctx){})
app.on('route:end', function(error, ctx, app){})
```

You can also add an array of request start / end functions that operate per
request, instead of globally on the app:

```
app.startRequest.push(function(app, server) {
  if (server) { console.log('started on the server'); }
});

app.endRequest.push(function(app, server) {
  if (server) { console.log('started on the server'); }
});
```


* This is all written using ES6, so you'll need to use a transpiler; I like
[babel](http://babeljs.io). To get babel to work with npm modules, you'll
need to turn off `ignore npm` and add `.es6.js` to the transpiled files, like
so:

```
require('babel/register')({
  ignore: false,
  only: /.+(?:(?:\.es6\.js)|(?:.jsx))$/,
  extensions: ['.js', '.es6.js', '.jsx' ],
  sourceMap: true,
});
```

* Tested with iojs 1.0.0 and later and node 0.10.30 and later.
