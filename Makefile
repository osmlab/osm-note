all: js/site.js

js/site.js: index.js package.json
	browserify js/index.js > js/site.js
