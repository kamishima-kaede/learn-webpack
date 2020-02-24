const { resolve } = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
//mini-css-extract-plugin
const miniCssExtractPlugin = require('mini-css-extract-plugin')

process.env.NODE_ENV = "development";

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'js/bulit.js',
        path: resolve(__dirname, 'build')
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    //创建style标签,将样式放入
                    // 'style-loader', 
                    //取代style-loader,作用:提取js中的css成单独文件
                    miniCssExtractPlugin.loader,
                    //将css文件整合到js文件中
                    'css-loader',
                    //默认配置
                    //'postcss-loader',
                    //修改配置
                    {
                        loader:'postcss-loader',
                        options:{
                            ident:'postcss',
                            plugins:()=>[
                                require('postcss-preset-env')()
                            ]
                        }
                    }
                ],
            },
            /*
                css兼容性处理:postcss-->postcss-loader  postcss-preset-env
                postcss-preset-env帮postcss找到package.json中browserslist中的配置,
                通过配置加载指定的css兼容性样式

                如何区别开发环境 生产环境?
                设置node环境变量:process.env.NODE_ENV
             */
            {
                test: /\.less$/,
                use: [
                    // 'style-loader', 
                    miniCssExtractPlugin.loader,
                    'css-loader', 
                    'less-loader'
                ],
            },
            {
                test: /\.(jpg|png|gif)$/,
                loader: 'url-loader',
                options: {
                    limit: 8 * 1024,
                    name: '[hash:10].[ext]',
                    esModule: false,
                    outputPath: 'imgs'
                }
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
            },
            {
                exclude: /\.(css|less|js|jpg|png|gif|html)$/,
                loader: 'file-loader',
                options: {
                    name: '[hash:10].[ext]',
                    outputPath: 'assest'
                }
            }
        ]
    },
    plugins: [
        new htmlWebpackPlugin({
            template: './src/assest/index.html'
        }),
        new miniCssExtractPlugin({
            filename:'css/built.css'
        })
    ],
    mode: 'development',
    devServer: {
        contentBase: resolve(__dirname, 'build'),
        //启用gzip压缩
        compress: true,
        port: 9960,
        open: true
    }
}