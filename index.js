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
require('./src/server');
