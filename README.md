# learn-webpack
## 生产环境配置

```js
const { resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// 定义nodejs环境变量：决定使用browserslist的哪个环境
process.env.NODE_ENV = 'production';

// 复用loader
const commonCssLoader = [
  MiniCssExtractPlugin.loader,
  'css-loader',
  {
    // 还需要在package.json中定义browserslist
    loader: 'postcss-loader',
    options: {
      ident: 'postcss',
      plugins: () => [require('postcss-preset-env')()]
    }
  }
];

module.exports = {
  entry: './src/js/index.js',
  output: {
    filename: 'js/built.js',
    path: resolve(__dirname, 'build')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [...commonCssLoader]
      },
      {
        test: /\.less$/,
        use: [...commonCssLoader, 'less-loader']
      },
      /*
        正常来讲，一个文件只能被一个loader处理。
        当一个文件要被多个loader处理，那么一定要指定loader执行的先后顺序：
          先执行eslint 在执行babel
      */
      {
        // 在package.json中eslintConfig --> airbnb
        test: /\.js$/,
        exclude: /node_modules/,
        // 优先执行
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          fix: true
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                useBuiltIns: 'usage',
                corejs: { version: 3 },
                targets: {
                  chrome: '60',
                  firefox: '50'
                }
              }
            ]
          ]
        }
      },
      {
        test: /\.(jpg|png|gif)/,
        loader: 'url-loader',
        options: {
          limit: 8 * 1024,
          name: '[hash:10].[ext]',
          outputPath: 'imgs',
          esModule: false
        }
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        exclude: /\.(js|css|less|html|jpg|png|gif)/,
        loader: 'file-loader',
        options: {
          outputPath: 'media'
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/built.css'
    }),
    new OptimizeCssAssetsWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      minify: {
        collapseWhitespace: true,
        removeComments: true
      }
    })
  ],
  mode: 'production'
};
```

```
注意点说明:
1.  webpack.config.js  webpack的配置文件
    作用: 指示 webpack 干哪些活（当你运行 webpack 指令时，会加载里面的配置）
    所有构建工具都是基于nodejs平台运行的~模块化默认采用commonjs。

2.	resolve用来拼接绝对路径的方法
	__dirname nodejs的变量，代表当前文件的目录绝对路径

3.	不同文件必须配置不同loader处理
	use数组中loader执行顺序：从右到左，从下到上 依次执行
	
	loader: 1. 下载   2. 使用（配置loader)
	plugins: 1. 下载  2. 引入  3. 使用

4.	对css处理:
	'style-loader':创建style标签，将js中的样式资源插入进行，添加到head中生效
	'css-loader':将css文件变成commonjs模块加载js中，里面内容是样式字符串
	'less-loader':将less编译成css
	
	mini-css-extract-plugin
		将 'style-loader' 替换成 MiniCssExtractPlugin.loader
		作用：提取js中的css成单独文件
		
		在plugins中对css文件进行重命名:new MiniCssExtractPlugin({filename: 'css/built.css'})

	css兼容性处理:postcss --> postcss-loader postcss-preset-env
	帮postcss找到package.json中browserslist里面的配置，通过配置加载指定的css兼容性样式
	
	压缩css:'optimize-css-assets-webpack-plugin'
		new OptimizeCssAssetsWebpackPlugin()

5.	对图片处理:'url-loader'
    问题：因为url-loader默认使用es6模块化解析，而html-loader引入图片是commonjs
    	解析时会出问题：[object Module]
    解决：关闭url-loader的es6模块化，使用commonjs解析
	
	处理html中的图片:'html-loader'


6.	打包html资源:'html-webpack-plugin'
	功能：默认会创建一个空的HTML，自动引入打包输出的所有资源（JS/CSS）
	需求：需要有结构的HTML文件;复制 './src/index.html' 文件，并自动引入打包输出的所有资源（JS/CSS）
	
	html压缩:
		HtmlWebpackPlugin-->minify:collapseWhitespace removeComments
	
	
7.	打包其他资源(仅做打包不做其他处理):'file-loader'
	
8.	对js处理:
	语法检查： eslint-loader  eslint
		在package.json中eslintConfig中设置检查规则
		一般使用airbnb --> eslint-config-airbnb-base  eslint-plugin-import eslint
	
	兼容性处理:babel-loader @babel/core
    	1)基本js兼容性处理 --> @babel/preset-env
            问题：只能转换基本语法，如promise高级语法不能转换
		2)全部js兼容性处理 --> @babel/polyfill  需要在入口文件引入
            问题：我只要解决部分兼容性问题，但是将所有兼容性代码全部引入，体积太大了~
		3)需要做兼容性处理的就做：按需加载  --> core-js
	
	js压缩:
		生产环境下会自动压缩 mode: 'production'
```



## 性能优化配置

```
webpack性能优化
* 开发环境性能优化
* 生产环境性能优化

开发环境性能优化
* 优化打包构建速度
  * HMR
* 优化代码调试
  * source-map

生产环境性能优化
* 优化打包构建速度
  * oneOf
  * babel缓存
  * 多进程打包
  * externals
  * dll
* 优化代码运行的性能
  * 缓存(hash-chunkhash-contenthash)
  * tree shaking
  * code split
  * 懒加载/预加载
  * pwa
```



### HMR

```js
/*
HMR: hot module replacement 热模块替换 / 模块热替换
  作用：一个模块发生变化，只会重新打包这一个模块（而不是打包所有模块） 
    极大提升构建速度

    1.样式文件：可以使用HMR功能：因为style-loader内部实现了~

    2.js文件：默认不能使用HMR功能 --> 需要修改js代码，添加支持HMR功能的代码
    	if (module.hot) {
          // 一旦 module.hot 为true，说明开启了HMR功能。 --> 让HMR功能代码生效
          module.hot.accept('./print.js', function() {
            // 方法会监听 print.js 文件的变化，一旦发生变化，其他模块不会重新打包构建。
            // 会执行后面的回调函数
            print();
          });
        }
      注意：HMR功能对js的处理，只能处理非入口js文件的其他文件。

    3.html文件: 默认不能使用HMR功能.同时会导致问题：html文件不能热更新了~ （不用做HMR功能）
      解决：修改entry入口，将html文件引入

	devServer-->hot:true
*/

```

### source-map

```js
/*
	source-map: 一种 提供源代码到构建后代码映射 技术 （如果构建后代码出错了，通过映射可以追踪源代码错误）
	开启:devtool: 'eval-source-map'
	
    [inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map

    source-map：外部
      错误代码准确信息 和 源代码的错误位置
      
    inline-source-map：内联
      只生成一个内联source-map
      错误代码准确信息 和 源代码的错误位置
      
    hidden-source-map：外部
      错误代码错误原因，但是没有错误位置
      不能追踪源代码错误，只能提示到构建后代码的错误位置
      
    eval-source-map：内联
      每一个文件都生成对应的source-map，都在eval
      错误代码准确信息 和 源代码的错误位置
      
    nosources-source-map：外部
      错误代码准确信息, 但是没有任何源代码信息
      
    cheap-source-map：外部
      错误代码准确信息 和 源代码的错误位置 
      只能精确的行
      
    cheap-module-source-map：外部
      错误代码准确信息 和 源代码的错误位置 
      module会将loader的source map加入

    内联 和 外部的区别：1. 外部生成了文件，内联没有 2. 内联构建速度更快

    开发环境：速度快，调试更友好
      速度快(eval>inline>cheap>...)
        eval-cheap-souce-map
        eval-source-map
      调试更友好  
        souce-map
        cheap-module-souce-map
        cheap-souce-map

      --> eval-source-map(Vue&React默认使用此)  / eval-cheap-module-souce-map

    生产环境：源代码要不要隐藏? 调试要不要更友好
      内联会让代码体积变大，所以在生产环境不用内联
      nosources-source-map 全部隐藏
      hidden-source-map 只隐藏源代码，会提示构建后代码错误信息

      --> source-map / cheap-module-souce-map
*/
```



### oneOf

```js
/*

*/
```





















```json
{
    "devDependencies": {
        "@babel/core": "^7.8.4",
        "@babel/polyfill": "^7.8.3",
        "@babel/preset-env": "^7.8.4",
        "add-asset-html-webpack-plugin": "^3.1.3",
        "babel": "^6.23.0",
        "babel-loader": "^8.0.6",
        "core-js": "^3.6.4",
        "css-loader": "^3.4.2",
        "eslint": "^6.8.0",
        "eslint-config-airbnb-base": "^14.0.0",
        "eslint-loader": "^3.0.3",
        "eslint-plugin-import": "^2.20.1",
        "file-loader": "^5.0.2",
        "html-loader": "^0.5.5",
        "html-webpack-plugin": "^3.2.0",
        "less": "^3.11.1",
        "less-loader": "^5.0.0",
        "mini-css-extract-plugin": "^0.9.0",
        "optimize-css-assets-webpack-plugin": "^5.0.3",
        "postcss-loader": "^3.0.0",
        "postcss-preset-env": "^6.7.0",
        "style-loader": "^1.1.3",
        "terser-webpack-plugin": "^2.3.5",
        "thread-loader": "^2.1.3",
        "url-loader": "^3.0.0",
        "webpack": "^4.41.6",
        "webpack-cli": "^3.3.11",
        "webpack-dev-server": "^3.10.3",
        "workbox-webpack-plugin": "^5.0.0"
    },
      "browserslist": {
        "development": [
          "last 1 chrome version",
          "last 1 firefox version",
          "last 1 safari version"
        ],
        "production": [
          ">0.2%",
          "not dead",
          "not op_mini all"
        ]
      },
      "eslintConfig": {
        "extends": "airbnb-base",
        "env": {
          "browser": true
        }
      },
      "sideEffects": [
        "*.css"
      ]
}
```

