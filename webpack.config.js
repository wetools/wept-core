module.exports = {
  output: {},
  devtool: 'cheap-module-eval-source-map',
  cache: true,
  debug: true,
  module: {
    loaders: [
      { test: /\.js$/, exclude: /(node_modules|dest)/, loader: 'babel?cacheDirectory' }
    ]
  }
}
