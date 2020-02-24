const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// process.env.NODE_ENV = "development";

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'js/bulit.js',
    path: resolve(__dirname, 'build'),
  },
  module: {
    rules: [
      // 语法检查 eslint-loader eslint
      // 只检查源代码
      // 设置检查规则 package.json中eslintConfig中设置,推荐airbnb
      // airbnb --> eslint-config-airbnb-base eslint eslint-plugin-import
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
        options: {},
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
  mode: 'development',
  devServer: {
    contentBase: resolve(__dirname, 'build'),
    // 启用gzip压缩
    compress: true,
    port: 9960,
    open: true,
  },
};
