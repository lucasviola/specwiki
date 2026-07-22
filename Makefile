.PHONY: build go build-all open-site

build:
	npm run build && npm link --force

go:
	specwiki generate && specwiki open

build-all:
	npm run build && npm run build:examples -- --all && npm run build:site

open-site:
	open dist/landing-site/examples/index.html 
