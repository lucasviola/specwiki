.PHONY: build go

build:
	npm run build && npm link --force

go:
	specwiki generate && specwiki open

build-site:
	npm run build && npm run build:examples -- --hero-only && npm run build:site

serve: 
	npx --yes serve dist/landing-site -p 4173
