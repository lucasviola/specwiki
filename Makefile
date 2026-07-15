.PHONY: build go

build:
	npm run build && npm link

go:
	specwiki generate && specwiki open
