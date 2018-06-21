src: https://medium.com/front-end-hacking/getting-started-with-your-react-app-with-express-server-1c701a3c6edb

npm init -y

npm install --save express react react-dom

* We will also be installing the following dev dependencies:

* Babel: For transpiling JSX and ES6 into ES5.
* CSS-loader, SASS-loader, Style-loader: For transpiling sass and css into our final js build file.
* Webpack, Webpack-cli: For our final build that will be served
* Mocha, Chai, Enzyme: This is optional. Use Whatever testing suite you are most comfortable with

npm install --save-dev babel babel-core babel-loader babel-preset-es2015 babel-preset-react css-loader node-sass sass-loader style-loader webpack webpack-cli mocha chai enzyme

* If you don’t have nodemon installed globally, install using:

npm install -g nodemon

// eslint issues:
ls -al /Users/maspen/.nvm/versions/node/v10.4.1/bin
lrwxr-xr-x  1 maspen  staff        40 Jun 15 10:55 eslint -> ../lib/node_modules/eslint/bin/eslint.js

Q: why not in global?

npm config get prefix
/Users/maspen/.nvm/versions/node/v10.4.1

npm config list
; cli configs
metrics-registry = "https://registry.npmjs.org/"
scope = ""
user-agent = "npm/6.1.0 node/v10.4.1 darwin x64"

; node bin location = /Users/maspen/.nvm/versions/node/v10.4.1/bin/node
; cwd = /Users/maspen
; HOME = /Users/maspen
; "npm config ls -l" to show all defaults.

which npm
/Users/maspen/.nvm/versions/node/v10.4.1/bin/npm


* .eslintrc.js example:
  https://gist.githubusercontent.com/leny/064f18f8924d5b172c7d/raw/9324bbfeb4c8016ad480302341332f2be4bee574/.eslintrc.json





# p1-google-photos-js
