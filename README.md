## ✡️ Atomic (web-version)
**This branch is a version that works exclusively in web browser**, The node version itself, web and node versions sources is available at src directory: **[src directory](https://github.com/spelsinx/atomic/tree/web-version/src)**.
<p align="center">
<img src="https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg?style=flat"></img>
</p>


## ℹ️ About and warning
This is not really an attempt to make a faster and more minimal version of React, but rather to try and understand how React, virtual home and JSX work.
> **Warning** <br>
> **This _small_ and _very unstable_ version is not recommended, but you can use it to create small websites.**

## 🖲️ Connection and Usage
1. Create a file with .html extension 
Connect the web version via a link or a file by adding a link to the script: 
1. **First** of the _options_, add **```<script src="https://unpkg.com/atomic-web@1.0.0/atomic.umd.js"></script>```** to your file with .html extension, or, **second** option of _options_ download and add the **[atomic.umd.js](https://github.com/spelsinx/atomic/blob/web-version/src/browser/atomic.umd.js)** file to your folder and then add **```<script src="atomic.umd.js"></script>```** to your file with .html extension.
4. And also, the last steps to launch your first site and see the result, add the first script to the page with atomic following: add this on body or header ```<script type="text/atomic" data-presets="react">``` and write down your code inside, for example: 
```js
/** @jsx atomic.createElement */
/** In the comment above we are telling babel which function it should
use the default is React.createElement and we want to use
our own createElement function*/

let hello = <h1>Hello!</h1>
atomic.render(hello, document.body)
``` 
and indent at the end and add a closing script tag: ```</script>``` and transfer/run your .html page in the browser.

## 📁 Documentation (COMMING SOON)

All documentation on methods, requests, and additional information is on the **[Wiki](https://github.com/spelsinx/atomic/wiki)**.

## 📃 License 

This information is distributed for informational purposes. We are not trying to offend anyone. For more information go to the file **[LICENSE](https://github.com/spelsinx/atomic/blob/node-version/LICENSE)**. 
