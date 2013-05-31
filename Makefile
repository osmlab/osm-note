all: js/site.js

js/site.js: js/index.js package.json node_modules
	browserify js/index.js > js/site.js
