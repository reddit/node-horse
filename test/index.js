require('babel/register')({
  extensions: ['.js', '.es6.js'],
  ignore: false,
  only: /.+(?:(?:\.es6\.js)|(?:.jsx))$/
});

require('./app');
require('./client');
