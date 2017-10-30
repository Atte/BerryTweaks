.PHONY: all clean min/js min/css

all: min/js min/css

min/js: js
	mkdir -p min/js/
	babel-minify --out-dir min/js/lib js/lib
	babel-minify --out-dir min/js js
	find min/js/ -type f -name '*.js' -print0 | xargs -0 --verbose \
		sed -r --in-place 's#atte.fi/berrytweaks/(css|js)/#atte.fi/berrytweaks/min/\1/#g'

min/css: css
	mkdir -p min/css/
	cp css/* min/css/

clean:
	rm -rf min
