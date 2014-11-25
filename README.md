switcharoo
==========

switcharoo is a web server and build system for building polymorphic
React applications in node. It is part of a larger series of plugins that,
together, form frontend applications for reddit.

A Brief Overview
----------------
This application provides the core to set up an Express web server and html5
history api, and have these send a request object (containing path, data, etc)
and a callback (a promise interface) to the App.

This application also provides a build system and a base css framework, shared
across plugins.

```
 +---------+          +---------------+
 | express |          | html5 history |
 +---------+          |     api       | 
    |                 +---------------+
 req, cb                   req, cb
    |                        |
    \                        /
     ------------------------
                |
                v
            +--------+
            | App.js |
            +--------+
                |
             (router)
                |
                v
            +--------+
            | plugin | -> cb.resolve({ body: reactElement })
            |        | -> cb.reject({ status: 401 })
            +--------+ 
```



The App has an instance of an Express-like request router that it uses to map
requests to the appropriate handling function, and is run on both the client-
and server- side. The React lifecycle can be used to control client-specific
code.

Plugins register themselves via two interfaces:

1. Route handlers that take two paramaters, `req` and `res`. `res` is a promise
  interface that should be called using
  `res.resolve({ body: reactElement, status: 200})` or
  `res.rejcet({ body: error, status: 400})`. (Body and status are optional in
  both cases, but should generally be added.)
  A complete example of route handling can be seen at
  [switcharoo-plugin-core](https://github.com/reddit/switcharoo-plugin-core).
2. Mutators that modify the rendering of react components. An element query
  syntax is provided, documentation forthcoming.


Getting Up and Running
----------------------

1. [Fork](https://github.com/reddit/switcharoo/fork) and clone
  this project.
2. Also fork and clone any plugins you plan on developing. In these, run
  `npm link` to cause the local version of the plugin to be linked to npm.
3. Run `npm install` to install other dependencies.
4. Run `npm start` to start the web server. Optionally, create a startup script
  at `start.sh` that sets environment variables and starts the server;
  `start.sh` has been added to the `.gitignore` and will not get checked in.

