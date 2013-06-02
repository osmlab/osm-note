.PHONY: mobile.manifest

all: js/site.js

mobile.manifest:
	node generate_manifest.js

js/site.js: js/index.js package.json node_modules
	browserify js/index.js > js/site.js
