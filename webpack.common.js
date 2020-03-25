const path = require('path');

module.exports = {
  entry: './src/index.browser.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: "tsconfig.json"
            }
          }
        ],
        exclude: /node_modules/
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'solid-auth-fetcher.bundle.js',
    path: path.resolve(__dirname, 'browserDist'),
    libraryTarget: 'var',
    library: 'solidAuthFetcher'
  }
};
