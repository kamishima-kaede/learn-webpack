const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// process.env.NODE_ENV = "development";

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'js/bulit.js',
    path: resolve(__dirname, 'build'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      // html压缩
      minify:{
        // 移除空格
        collapseWhitespace:true,
        // 移除注释
        removeComments:true,
      }
    }),
  ],

  // 生产环境会自动压缩js代码
  mode: 'production',

  devServer: {
    contentBase: resolve(__dirname, 'build'),
    // 启用gzip压缩
    compress: true,
    port: 9960,
    open: true,
  },
};
