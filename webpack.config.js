'use strict'

const { version, name } = require('./package.json');
const { join, resolve } = require('path');

const webpack = require('webpack')
const glob = require('glob');

const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

const extractCSS = new ExtractTextPlugin({
  filename: 'assets/css/[name].css',
  allChunks: true
})
const extractLESS = new ExtractTextPlugin({
  filename: 'assets/css/[name].less',
  allChunks: true
})

const entries = {}
const chunks = []

glob.sync('./src/pages/**/app.js').forEach(path => {
  const chunk = path.split('./src/pages/')[1].split('/app.js')[0]
  entries[chunk] = path
  chunks.push(chunk)
})

let publicPath = '/';

const config = {
  entry: entries,
  output: {
      path: resolve(__dirname, './dist'),
      filename: 'assets/js/[name].js',
      publicPath: publicPath
  },
  resolve: {
      extensions: ['.js', '.vue'],
      alias: {
          assets: join(__dirname, '/src/assets'),
          components: join(__dirname, '/src/components'),
          root: join(__dirname, 'node_modules')
      }
  },
  module: {
      rules: [
          {
              test: /\.js$/,
              use: 'babel-loader',
              exclude: /node_modules/
          },
          {
              test: /\.css$/,
              use: ['css-hot-loader'].concat(ExtractTextPlugin.extract({
                  use: ['css-loader', 'postcss-loader'],
                  fallback: 'style-loader'
              }))
          },
          {
              test: /\.less$/,
              use: ['css-hot-loader'].concat(ExtractTextPlugin.extract({
                  use: ['css-loader', 'postcss-loader', 'less-loader'],
                  fallback: 'style-loader'
              }))
          },
          {
              test: /\.html$/,
              use: [{
                  loader: 'html-loader',
                  options: {
                      root: resolve(__dirname, 'src'),
                      attrs: ['img:src', 'link:href']
                  }
              }]
          },
          {
              test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
              exclude: /favicon\.png$/,
              use: [{
                  loader: 'url-loader',
                  options: {
                      limit: 500,
                      name: 'assets/img/[name].[hash:7].[ext]'
                  }
              }]
          }
      ]
  },
  plugins: [
      new webpack.ProvidePlugin({
          $: "jquery"
      }),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CommonsChunkPlugin({
          name: 'vendors',
          filename: 'assets/js/vendors.js',
          chunks: chunks,
          minChunks: chunks.length
      }),
      extractLESS,
      extractCSS
  ],
  devServer: {
      host: '0.0.0.0',
      port: 8010,
      historyApiFallback: false,
      noInfo: true,
      disableHostCheck: true,
      proxy: {
          '/api': {
              target: 'http://127.0.0.1:8080',
              changeOrigin: true,
              pathRewrite: { '^/api': '' }
          }, '/business/apply': {
              'target': 'http://test.magic.shuwen.com/',
              'changeOrigin': true
          },
      },
      open: true,
      openPage: 'select.html'
  },
  devtool: '#eval-source-map'
}

glob.sync('./src/pages/**/*.html').forEach(path => {
  const chunk = path.split('./src/pages/')[1].split('/app.html')[0]
  const filename = chunk + '.html'
  const htmlConf = {
      filename: filename,
      template: path,
      inject: 'body',
      favicon: './src/assets/img/logo.jpg',
      hash: process.env.NODE_ENV === 'production',
      chunks: ['vendors', chunk]
  }
  config.plugins.push(new HtmlWebpackPlugin(htmlConf))
})

module.exports = config

