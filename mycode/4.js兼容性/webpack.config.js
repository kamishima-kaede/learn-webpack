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
      // js兼容性处理 babel-loader @babel/core @babel/preset-env
      // 1.基本js兼容性处理:@babel/preset-env
      // 2.全部js兼容性处理:@babel/polyfill 使用时入口文件引入;问题,全部引入,文件过大
      // 3.按需加载:core-js
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        // options: {
        //   // 预设:指示babel做怎么样的兼容性处理
        //   presets: ['@babel/preset-env'],
        // },
        options: {
          // 预设:指示babel做怎么样的兼容性处理
          presets: [
            [
              '@babel/preset-env',
              {
                // 按需加载
                useBuiltIns: 'usage',
                // 指定core-js版本
                corejs: {
                  version: 3,
                },
                targets: {
                  chrome: '60',
                  firefox: '50',
                  ie: '9',
                  safari: '10',
                  edge: '17',
                },
              },
            ],
          ],
        },
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
