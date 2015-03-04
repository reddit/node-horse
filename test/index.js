require('6to5/register')({
  extensions: ['.js', '.es6.js'],
  experimental: true,
});

require('./app');
require('./client');
