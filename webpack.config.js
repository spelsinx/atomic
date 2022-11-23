const path = require("path"); 
const HtmlWebpackPlugin = require("html-webpack-plugin"); 
  
 module.exports = { 
   entry: "./src/index.js", 
   output: { 
     filename: "main.js", 
     path: path.resolve(__dirname, "build"), 
   }, 
   plugins: [ 
     new HtmlWebpackPlugin({ 
       template: path.join(__dirname, "public", "index.html"), 
     }), 
   ], 
   devServer: { 
     static: { 
       directory: path.join(__dirname, "build"), 
     }, 
     port: 3000, 
   }, 
   module: { 
     // exclude node_modules 
     rules: [ 
       { 
         test: /\.(js|jsx)$/, 
         exclude: /node_modules/, 
         loader: "babel-loader",
         options: { presets: ['@babel/env','@babel/preset-react'] }
       }, 
     ], 
   }, 
   // pass all js files through Babel 
   resolve: { 
     extensions: ["*", ".js", ".jsx"], 
   }
 };