// take js file
// watch and rebuild it

var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var rev = require('gulp-rev');
var rename = require('gulp-rename');
var buffer = require('gulp-buffer');
var clean = require('gulp-rimraf');
var concat = require('gulp-concat');
var source = require('vinyl-source-stream');
var streamqueue = require('streamqueue');

var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var exorcist = require('exorcist');

module.exports = function buildJS(gulp, buildjs) {
  function compile(watch) {
    gutil.log('Starting browserify');

    var entryFile = './assets/js/client.es6.js';

    var bundler = browserify({
      cache: {},
      packageCache: {},
      //fullPaths: true,
      debug: true,
      extensions: ['.js', '.es6.js', '.jsx'],
    });

    if (watch) {
      bundler = watchify(bundler);
    }

    // Add in a few common dependencies so we don't end up browserifying
    // multiple versions in dev, because `npm link` behaves really oddly at
    // times
    bundler
      .require('moment')
      .require('q')
      .require('react')
      .require('jquery')
      .require('reddit-text-js')
      .require('snoode')
      .require('superagent')
      .require('./lib/snooboots/dist/js/bootstrap.js', {
        expose: 'bootstrap',
        depends: {
          'jquery': 'jQuery'
        }
      });

    bundler.add(entryFile);

    bundler
      .transform(babelify.configure({
        ignore: false,
        only: /.+(?:(?:\.es6\.js)|(?:.jsx))$/,
        extensions: ['.js', '.es6.js', '.jsx' ],
        sourceMap: true,
      }), {
        global: true,
      });

    var rebundle = function () {
      var stream = bundler.bundle();

      stream.on('error', function (err) { console.error(err.toString()) });

      gulp.src(buildjs + '/client*.js')
        .pipe(clean({force: true}));


      var shims = streamqueue({ objectMode: true });
      shims.queue(gulp.src('public/js/es5-shims.js'));
      shims.queue(gulp.src('node_modules/babel/browser-polyfill.js'));

      shims.done()
        .pipe(concat('shims.js'))
        .pipe(gulp.dest(buildjs));

      stream
        .pipe(exorcist(buildjs + '/client.js.map'))
        .pipe(source(entryFile))
        .pipe(rename('client.js'))
        .pipe(gulp.dest(buildjs))
        .pipe(streamify(uglify()))
        .pipe(rename('client.min.js'))
        .pipe(buffer())
        .pipe(rev())
        .pipe(gulp.dest(buildjs))
        .pipe(rev.manifest())
        .pipe(rename('client-manifest.json'))
        .pipe(gulp.dest(buildjs));
    }

    bundler.on('update', rebundle);
    return rebundle();
  }

  return {
    compile: compile,
  };
}
