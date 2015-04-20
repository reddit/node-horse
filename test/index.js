require('babel/register')({
  extensions: ['.js', '.es6.js'],
  experimental: true,
});

require('./app');
require('./client');
