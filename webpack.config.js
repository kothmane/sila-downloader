import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import webpack from 'webpack';
import CspHtmlWebpackPlugin from 'csp-html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  entry: './src/renderer/index.jsx',
  target: 'web',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { electron: '37' } }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],/* 
            plugins: [
              'react-refresh/babel'
            ] */
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@/src': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/contexts': path.resolve(__dirname, 'src/contexts'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: './', // Important for React Router
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      meta: {
        'Content-Security-Policy': {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        },
      },
    }),
    new CspHtmlWebpackPlugin({
      'default-src': "'self'",
      'script-src': "'self' 'unsafe-inline'",
      'style-src': "'self' 'unsafe-inline'",
      'connect-src': "'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com/ https://sila-platform-backend.onrender.com",
      'img-src': "'self' https://sila-platform.s3.eu-west-3.amazonaws.com https://d16482yo95cp3a.cloudfront.net data: blob:",
    }),
    new webpack.DefinePlugin({
      /* 'process.env.NODE_ENV': JSON.stringify('development'), */
      'process.env.NEXT_PUBLIC_BACKEND_URL': JSON.stringify("https://sila-platform-backend.onrender.com"),
    }),
    new ReactRefreshWebpackPlugin(),
  ],
  optimization: {
    sideEffects: true,
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    port: 3000,
    hot: true,
    historyApiFallback: true, // This is crucial for React Router
    compress: true,
    open: false,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    liveReload: true,
  },
};
