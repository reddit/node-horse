'use strict';

require('6to5/register')({
  ignore: false,
  only: /.+(?:(?:\.es6\.js)|(?:.jsx))$/,
  extensions: ['.js', '.es6.js', '.jsx' ],
  sourceMap: true,
});

/** File paths */
var build = './build';
var buildjs = build + '/js';
var buildcss = build + '/css';

var gulp = require('gulp');

var config = require('./src/config.es6.js').default;

var buildJS = require('./buildTasks/js')(gulp, buildjs);
var buildLess = require('./buildTasks/less')(gulp, buildcss)

gulp.task('less', buildLess.compile());
gulp.task('js', buildJS.compile());

gulp.task('default', ['js', 'less']);

gulp.task('watch', ['js', 'less'], function() {
  var lrServer = livereload();
  var reloadPage = function (evt) {
    lrServer.changed(evt.path);
  };

  buildJS.compile(true);
  buildLess.compile(true)

  gulp.watch([build + '/**/*'], reloadPage);
});
