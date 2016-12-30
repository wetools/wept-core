var path = require('path')
var growl = require('growl')
var serve = require('gulp-live-serve')
var livereload = require('gulp-livereload')
var webpack = require('webpack')
var gulpWebpack = require('gulp-webpack')
var gulp = require('gulp')
var webpackConfig = require('./webpack.config')

// example index
var exampleFiles = ['example/*.css', 'example/bundle.js', 'example/index.html']
var main = './example/index.js'
var myConfig = Object.assign({}, webpackConfig, {
  entry: main,
  output: {
    filename: 'bundle.js',
  },
  debug: true,
  devtool: 'cheap-module-eval-source-map',
  watch: true
})

gulp.task('build', ['serve'], function () {
  livereload.listen({
    start: true
  })
  // reload on file change
  var watcher = gulp.watch(exampleFiles)
  watcher.on('change', function (e) {
    livereload.changed(e.path)
    growl(path.basename(e.path))
  })

  return gulp.src('example/index.js')
    .pipe(gulpWebpack(myConfig, webpack))
    .pipe(gulp.dest('example'))
})

// static server
gulp.task('serve', serve({
  root: __dirname,
  middlewares: []
}))

gulp.task('default', ['build'])

