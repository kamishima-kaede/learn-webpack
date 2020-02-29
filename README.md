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



### dev-HMR

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

### dev-source-map

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



### pro优化打包构建速度-oneOf

```js
/*
	优化生产环境打包速度
	
	正常来说,单个文件会被所有loader处理,有的能命中处理有的不能
	oneOf中以下loader只会匹配一个,提高loader处理效率
	注意:不能有两个配置处理同一种类型文件
*/
```





### pro优化打包构建速度-babel缓存

```js
/*
	babel缓存
		options-->cacheDirectory:true
			-->第二次构建时,会读取缓存,加快打包处理
*/
```

### pro优化打包构建速度-多线程打包

```js
/* 
  开启多进程打包。 
  进程启动大概为600ms，进程通信也有开销。
  只有工作消耗时间比较长，才需要多进程打包
*/
{
  loader: 'thread-loader',
  options: {
    workers: 2 // 进程2个
  }
}
```



### pro优化打包构建速度-externals

```js
/*
	完全不打包引用的库,配合dll使用或者配合CDN使用
*/
externals: {
  // 拒绝jQuery被打包进来
  jquery: 'jQuery'
}
```



### pro优化打包构建速度-dll

```js
/*
  使用dll技术，对某些库（第三方库：jquery、react、vue...）进行单独打包
    当你运行 webpack 时，默认查找 webpack.config.js 配置文件
    需求：需要运行 webpack.dll.js 文件
      --> webpack --config webpack.dll.js
*/

// webpack.dll.js 配置好依赖后仅需打包一次
// webpack --config webpack.dll.js--> manifest.json文件
const { resolve } = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    // 最终打包生成的[name] --> jquery
    // ['jquery'] --> 要打包的库是jquery
    jquery: ['jquery'],
  },
  output: {
    filename: '[name].js',
    path: resolve(__dirname, 'dll'),
    library: '[name]_[hash]' // 打包的库里面向外暴露出去的内容叫什么名字
  },
  plugins: [
    // 打包生成一个 manifest.json --> 提供和jquery映射
    new webpack.DllPlugin({
      name: '[name]_[hash]', // 映射库的暴露的内容名称
      path: resolve(__dirname, 'dll/manifest.json') // 输出文件路径
    })
  ],
  mode: 'production'
};

// webpack.js 中配置 add-asset-html-webpack-plugin
// 通过生成的 manifest.json 文件映射无需打包的资源文件
plugins: [
  // 告诉webpack哪些库不参与打包，同时使用时的名称也得变~
  new webpack.DllReferencePlugin({
    manifest: resolve(__dirname, 'dll/manifest.json')
  }),
  // 将某个文件打包输出去，并在html中自动引入该资源
  new AddAssetHtmlWebpackPlugin({
    filepath: resolve(__dirname, 'dll/jquery.js')
  })
],
```



### pro优化代码运行性能-文件资源缓存

```js
/*	
文件资源缓存
	hash: 每次wepack构建时会生成一个唯一的hash值。
        问题: 因为js和css同时使用一个hash值。
			如果重新打包，会导致所有缓存失效。（可能我却只改动一个文件）
	chunkhash：根据chunk生成的hash值。如果打包来源于同一个chunk，那么hash值就一样
		问题: js和css的hash值还是一样的
			因为css是在js中被引入的，所以同属于一个chunk
	contenthash: 根据文件的内容生成hash值。不同文件hash值一定不一样   
		--> 让代码上线运行缓存更好使用
*/			
```



### pro优化代码运行性能-tree-shaking

```js
/*
	tree shaking：去除无用代码
    	前提：1. 必须使用ES6模块化  2. 开启production环境
    	作用: 减少代码体积

    在package.json中配置 
      "sideEffects": false 所有代码都没有副作用（都可以进行tree shaking）
        问题：可能会把css / @babel/polyfill （副作用）文件干掉
      "sideEffects": ["*.css", "*.less"]
*/
```



### pro优化代码运行性能-code split

```js
/*
	code split针对的是js文件,优化代码性能
	方式一:
		多入口：有一个入口，最终输出就有一个bundle
	方式二:
		  optimization: {
            splitChunks: {
              chunks: 'all'
            }
          },
		1.如果是单入口:可以将node_modules中代码单独打包一个chunk最终输出bundle
		2.如果是多入口,除了1,还会自动分析多入口chunk中，有没有公共的文件。如果有会打包成单独一个chunk
	
	方式三:
		单入口,并配置optimization选项,走1
		通过js代码，让某个文件被单独打包成一个chunk
			import动态导入语法：能将某个文件单独打包
		并在package.json中配置sideEffects选项
*/
```



### pro优化代码运行性能-懒加载/预加载

```js
/*	
	懒加载~(一般是js)：当文件需要使用时才加载;优点加快主要文件加载,缺点文件较大的时候用户体验差
	预加载 prefetch：会在使用之前，提前加载js文件
	正常加载可以认为是并行加载（同一时间加载多个文件）
	预加载 prefetch：等其他资源加载完毕，浏览器空闲了，再偷偷加载资源;缺点兼容性问题
*/
// 在js文件中动态引入代码
import(/* webpackChunkName: 'test', webpackPrefetch: true */'./test').then(({ mul }) => {
	console.log(mul(4, 5));
});
```



### pro优化代码运行性能-pwa

```js
/*
  PWA: 渐进式网络开发应用程序(离线可访问)
    workbox --> workbox-webpack-plugin
*/
new WorkboxWebpackPlugin.GenerateSW({
  /*
    1. 帮助serviceworker快速启动
    2. 删除旧的 serviceworker

    生成一个 serviceworker 配置文件~
  */
  clientsClaim: true,
  skipWaiting: true
})

// 入口文件
/*
  1. eslint不认识 window、navigator全局变量
    解决：需要修改package.json中eslintConfig配置
      "env": {
        "browser": true // 支持浏览器端全局变量
      }
   2. sw代码必须运行在服务器上
      --> nodejs
      -->
        npm i serve -g
        serve -s build 启动服务器，将build目录下所有资源作为静态资源暴露出去
*/
// 注册serviceWorker
// 处理兼容性问题
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => {
        console.log('sw注册成功了~');
      })
      .catch(() => {
        console.log('sw注册失败了~');
      });
  });
}
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



## webpack配置详解

### entry

```js
/*
  entry: 入口起点
    *1. string --> './src/index.js'
      单入口
      打包形成一个chunk。 输出一个bundle文件。
      此时chunk的名称默认是 main
      
    2. array  --> ['./src/index.js', './src/add.js']
      多入口
      所有入口文件最终只会形成一个chunk, 输出出去只有一个bundle文件。
        --> 只有在HMR功能中让html热更新生效~
        
    *3. object
      多入口
      有几个入口文件就形成几个chunk，输出几个bundle文件
      此时chunk的名称是 key

      --> 特殊用法
        {
          // 所有入口文件最终只会形成一个chunk, 输出出去只有一个bundle文件。
          index: ['./src/index.js', './src/count.js'], 
          // 形成一个chunk，输出一个bundle文件。
          add: './src/add.js'
        }
*/
```



### output

```js
output: {
  // 文件名称（指定名称+目录）
  filename: 'js/[name].js',
  // 输出文件目录（将来所有资源输出的公共目录）
  path: resolve(__dirname, 'build'),
  // 所有资源引入公共路径前缀 --> 'imgs/a.jpg' --> '/imgs/a.jpg'
  publicPath: '/',
  chunkFilename: 'js/[name]_chunk.js', // 非入口chunk的名称
  // library: '[name]', // 整个库向外暴露的变量名
  // libraryTarget: 'window' // 变量名添加到哪个上 browser
  // libraryTarget: 'global' // 变量名添加到哪个上 node
  // libraryTarget: 'commonjs'
},
```



### module

```js
module: {
  rules: [
    // loader的配置
    {
      test: /\.css$/,
      // 多个loader用use
      use: ['style-loader', 'css-loader']
    },
    {
      test: /\.js$/,
      // 排除node_modules下的js文件
      exclude: /node_modules/,
      // 只检查 src 下的js文件
      include: resolve(__dirname, 'src'),
      // 优先执行
      enforce: 'pre',
      // 延后执行
      // enforce: 'post',
      // 单个loader用loader
      loader: 'eslint-loader',
      options: {}
    },
    {
      // 以下配置只会生效一个
      oneOf: []
    }
  ]
}
```



### resolve

```js
resolve: {
  // 配置解析模块路径别名: 优点简写路径 缺点路径没有提示
  alias: {
    $css: resolve(__dirname, 'src/css')
  },
  // 配置省略文件路径的后缀名
  extensions: ['.js', '.json', '.jsx', '.css'],
  // 告诉 webpack 解析模块是去找哪个目录
  modules: [resolve(__dirname, '../../node_modules'), 'node_modules']
}
```



### devServer

```js
devServer: {
  // 运行代码的目录
  contentBase: resolve(__dirname, 'build'),
  // 监视 contentBase 目录下的所有文件，一旦文件变化就会 reload
  watchContentBase: true,
  watchOptions: {
    // 忽略文件
    ignored: /node_modules/
  },
  // 启动gzip压缩
  compress: true,
  // 端口号
  port: 5000,
  // 域名
  host: 'localhost',
  // 自动打开浏览器
  open: true,
  // 开启HMR功能
  hot: true,
  // 不要显示启动服务器日志信息
  clientLogLevel: 'none',
  // 除了一些基本启动信息以外，其他内容都不要显示
  quiet: true,
  // 如果出错了，不要全屏提示~
  overlay: false,
  // 服务器代理 --> 解决开发环境跨域问题
  proxy: {
    // 一旦devServer(5000)服务器接受到 /api/xxx 的请求，就会把请求转发到另外一个服务器(3000)
    '/api': {
      target: 'http://localhost:3000',
      // 发送请求时，请求路径重写：将 /api/xxx --> /xxx （去掉/api）
      pathRewrite: {
        '^/api': ''
      }
    }
  }
}
```



### optimization

```js
optimization: {
  splitChunks: {
    chunks: 'all'
    // 默认值，可以不写~
    /* minSize: 30 * 1024, // 分割的chunk最小为30kb
    maxSiza: 0, // 最大没有限制
    minChunks: 1, // 要提取的chunk最少被引用1次
    maxAsyncRequests: 5, // 按需加载时并行加载的文件的最大数量
    maxInitialRequests: 3, // 入口js文件最大并行请求数量
    automaticNameDelimiter: '~', // 名称连接符
    name: true, // 可以使用命名规则
    cacheGroups: {
      // 分割chunk的组
      // node_modules文件会被打包到 vendors 组的chunk中。--> vendors~xxx.js
      // 满足上面的公共规则，如：大小超过30kb，至少被引用一次。
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        // 优先级
        priority: -10
      },
      default: {
        // 要提取的chunk最少被引用2次
        minChunks: 2,
        // 优先级
        priority: -20,
        // 如果当前要打包的模块，和之前已经被提取的模块是同一个，就会复用，而不是重新打包模块
        reuseExistingChunk: true
      } 
    }*/
  },
  // 将当前模块的记录其他模块的hash单独打包为一个文件 runtime
  // 解决：修改a文件导致b文件的contenthash变化
  runtimeChunk: {
    name: entrypoint => `runtime-${entrypoint.name}`
  },
  minimizer: [
    // 配置生产环境的压缩方案：js和css
    new TerserWebpackPlugin({
      // 开启缓存
      cache: true,
      // 开启多进程打包
      parallel: true,
      // 启动source-map
      sourceMap: true
    })
  ]
}
```



# webpack5