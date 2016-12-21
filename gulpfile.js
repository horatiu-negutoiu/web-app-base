/////////////////////////////////////////////////////////////////////////////////////
//
// GLOBALS
//
/////////////////////////////////////////////////////////////////////////////////////
var browserify = require('browserify');
var ngAnnotate = require('browserify-ngannotate');
var del = require('del');
var gulp = require('gulp');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var decomment = require('gulp-decomment');
var envToJson = require('gulp-dotenv');
var filter = require('gulp-filter');
var imagemin = require('gulp-imagemin');
var minifyHtml = require('gulp-htmlmin');
var ngHtml2Js = require("gulp-ng-html2js");
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var size = require('gulp-size');
var sourcemaps = require('gulp-sourcemaps');
var template = require('gulp-template');
var uglify = require('gulp-uglify');
var util = require('gulp-util');
var mainBowerFiles = require('main-bower-files');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');

var CacheBuster = require('gulp-cachebust');
var cachebust = new CacheBuster();

/////////////////////////////////////////////////////////////////////////////////////
//
// SET ENVIRONMENT VARIABLES FROM THE .ENV file
//
/////////////////////////////////////////////////////////////////////////////////////
require('dotenv').config();

gulp.task('config-env', function() {
  util.log(util.colors.bgGreen.black('Setting up for ' + process.env.ENVIRONMENT + '.'));
  process.env.ENVIRONMENT === 'production' ? process.env.NODE_ENV = 'production' : util.noop();
  process.env.ENVIRONMENT === 'development' ? process.env.NODE_ENV = 'development' : util.noop();
  util.log(util.colors.bgGreen.black('Configured for ' + process.env.NODE_ENV + '.'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// CLEAN OUTPUT FOLDER
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('clean', ['config-env'], function (cb) {
  util.log(util.colors.bgGreen.black('Cleaning.'));
  return del(['./build/'], cb);              // delete the 'build' directory
});

/////////////////////////////////////////////////////////////////////////////////////
//
// BOWER LIB
//
/////////////////////////////////////////////////////////////////////////////////////
// Notes: order coming out of here seems to be fine (jQ, An, Boot)
gulp.task('bower-components', ['clean'], function() {
  //TODO: minify the output in production
  util.log(util.colors.bgGreen.black('Compiling BOWER JS in ' + process.env.ENVIRONMENT + "."));

  return gulp.src(mainBowerFiles())   // load the main bower_components files
  .pipe(filter('**/*.js'))            // filter the js ones
  .pipe(concat('vendor.js'))          // put them all into one file
  .pipe(cachebust.resources())        // collect cachebust resources
  .pipe(size({                        // show user what is about to become the output
    title: "All script dependencies ->"
  }))
  .pipe(gulp.dest('./build/lib/'));   // place into destination
});

/////////////////////////////////////////////////////////////////////////////////////
//
// JS
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('build-js', ['clean'], function() {
  util.log(util.colors.bgGreen.black('Compiling app JS.'));
  //TODO: use util.env then uglify() or util.noop() depending on var 

  var bEntries = './src/js/app.js';
  var bDebug = true;
  var bPaths = ['./src/js/components'];
  var bTransform = [ngAnnotate];    // dependency injection annotations

  var b = browserify({
    entries: bEntries,
    debug: bDebug,
    paths: bPaths,
    transform: bTransform
  });

  return b.bundle()
  .pipe(source('bundle.js'))          // streams the bundle.js outputed by browserify
  .pipe(buffer())                     // collects the browserify stream
  .pipe(process.env.WITH_SOURCE_MAPS === 'true' ? sourcemaps.init({loadMaps: true}) : util.noop())
  .pipe(concat('scripts.js'))         // concatenates all the files into final script
  // remove their comments when compiling for production
  .pipe(process.env.ENVIRONMENT === 'production' ? decomment() : util.noop())
  // minify javascripts if compiling for production
  .pipe(process.env.ENVIRONMENT === 'production' ? uglify() : util.noop())
  .pipe(size({                        // show user what is about to become the output
    title: "All app scripts ->"
  }))
  .pipe(process.env.WITH_SOURCE_MAPS === 'true' ? sourcemaps.write('./') : util.noop())
  .pipe(gulp.dest('build/js/'));      // output
});

/////////////////////////////////////////////////////////////////////////////////////
//
// UPDATE FINAL FILE WITH APP PARAMETERS
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('js-with-env', ['build-js'], function() {
  util.log(util.colors.bgGreen.black('Generating JS site variables.'));
  return gulp.src('./build/js/scripts.js')
  .pipe(template({
    apiHost: process.env.API_HOST,
    tabSite: process.env.TAB_SITE,
    downloadPath: process.env.DOWNLOAD_PATH,
    appPath: process.env.APP_PATH,
    docPath: process.env.DOC_PATH
  }))
  .pipe(cachebust.resources())        // collect cachebust resources
  .pipe(debug({title: 'hello'}))
  .pipe(gulp.dest('build/js/'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// CSS + BOOTSTRAP COMPILER
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('build-css', ['clean'], function() {
  util.log(util.colors.bgGreen.black('Compiling app CSS.'));

  var outputStyle = process.env.ENVIRONMENT === 'production' ? 'compressed' : 'expanded';

  sassPaths = [
    './bower_components/bootstrap-sass/assets/stylesheets',
    './bower_components/bootstrap-sass/assets/stylesheets/bootstrap',
    './bower_components/font-awesome/scss'
  ];

  return gulp.src('./src/scss/main.scss')
  .pipe(rename('styles.scss'))
  .pipe(process.env.WITH_SOURCE_MAPS === 'true' ? sourcemaps.init() : util.noop())
  .pipe(sass({outputStyle: outputStyle, includePaths: sassPaths}))
  .pipe(cachebust.resources())          // collect cachebust resources
  .pipe(process.env.WITH_SOURCE_MAPS === 'true' ? sourcemaps.write('./') : util.noop())
  .pipe(gulp.dest('./build/css'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// FONTS
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('build-fonts', ['clean'], function() {
  util.log(util.colors.bgGreen.black('Copying fonts.'));

  return gulp.src('./bower_components/font-awesome/fonts/**/*')
  .pipe(gulp.dest('./build/fonts/'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// IMAGES
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('build-images', ['clean'], function() {
  util.log(util.colors.bgGreen.black('Compiling app images.'));

  return gulp.src('./src/images/**.*')
    .pipe(imagemin({
      verbose: true
    }))
    .pipe(gulp.dest('./build/images'));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// TEMPLATE-CACHE PARTIALS
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('build-template-cache', ['clean'], function() {
  util.log(util.colors.bgGreen.black('Compiling template cache.'));

  return gulp.src("./src/partials/**/*.html")
  .pipe(minifyHtml({
    caseSensitive: true,
    removeComments: true,
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true
  }))
  .pipe(ngHtml2Js({
    moduleName: "appPartials",
    prefix: "/partials/"
  }))
  .pipe(concat("partials.min.js"))
  .pipe(uglify())
  .pipe(cachebust.resources())          // collect cachebust resources
  .pipe(gulp.dest("./build/js"));
});

/////////////////////////////////////////////////////////////////////////////////////
//
// HTML
//
// Builds bower javascripts, app scripts, app css.
//
/////////////////////////////////////////////////////////////////////////////////////
gulp.task('full-build', [
    'bower-components', 
    'js-with-env', 
    'build-css', 
    'build-fonts', 
    'build-images', 
    'build-template-cache'
  ], function() {
  util.log(util.colors.bgGreen.black('Compiling app HTML.'));
  //TODO: add cachebust references
  del(['./build/js/scripts.js']); // delete the 'scripts.js'

  return gulp.src('src/index.html')     // load the index.html file
  .pipe(cachebust.references())         // insert cachebusting references
  .pipe(gulp.dest('./build/'));         // place into destination
});

gulp.task('default', ['full-build']);
