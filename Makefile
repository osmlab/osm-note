.PHONY: mobile.manifest

all: js/site.min.js js/lib.min.js

mobile.manifest:
	node generate_manifest.js

js/site.js: js/index.js package.json node_modules
	browserify js/index.js > js/site.js

js/lib.js: js/lib/*
	cat js/lib/fastclick.js \
		js/lib/zepto.min.js \
		js/lib/add2home.js \
		js/lib/leaflet/leaflet.js > js/lib.js

js/site.min.js: js/site.js
	uglifyjs js/site.js -c > js/site.min.js

js/lib.min.js: js/lib.js
	uglifyjs js/lib.js -c > js/lib.min.js

clean:
	rm js/lib.js
	rm js/site.js
	rm js/lib.min.js
	rm js/site.min.js
