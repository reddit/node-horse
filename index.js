// Register that we're using es6, so 6to5 can compile import statements.
// The `ignore` set to false allows 6to5 to compile npm modules, and the `only`
// forces it to only compile files with a `.es6.js` or `.jsx` extension.
require('6to5/register')({
  ignore: false,
  only: /.+(?:(?:\.es6\.js)|(?:.jsx))$/,
  extensions: ['.js', '.es6.js', '.jsx' ],
  sourceMap: true,
});

// Require in the express server.
var Server = require('./src/server');

var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

// App config
var config = require('./src/config');

// Import built-asset manifests for passing to layouts
var jsManifest = require('./build/js/client-manifest.json');
var cssManifest = require('./build/css/css-manifest.json');
var servers = [];

// Then merge them into a single object for ease of use later
config.manifest = {};
Object.assign(config.manifest, jsManifest, cssManifest);

function start(config) {
  var server = new Server(config);
  server.start();
  return server;
}

// Private, server-only config that we don't put in config.js, which is shared
config.liveReload = process.env.LIVERELOAD || true;
config.cookieSecret = process.env.SWITCHAROO_COOKIE_SECRET || 'snoo';
config.oauth = {
  clientId: process.env.OAUTH_CLIENT_ID || '',
  secret: process.env.OAUTH_SECRET || '',
};

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    if (failedProcesses < 20) {
      console.log('Worker ' + worker.process.pid + ' died, restarting.');
      cluster.fork();
      failedProcesses++;
    } else {
      console.log('Workers died too many times, exiting.');
      process.exit();
    }
  });
} else {
  servers.push(start(config));
}
