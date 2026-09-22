const { defineConfig } = require('@rspack/cli');
const path = require('path');

module.exports = defineConfig({
  entry: {
    main: './src/frontend/index.jsx',
  },
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    filename: 'bundle.js',
    publicPath: '/dist/', // <-- matches your manual <script src="/dist/bundle.js">
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  optimization: {
    minimize: true,
  },
  target: 'web',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // serves public/index.html at localhost:8080/
    },
    port: 8080,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3000',
      },
    ],
  },
});