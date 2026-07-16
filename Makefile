.PHONY: build go

build:
	npm run build && npm link --force

go:
	specwiki generate && specwiki open
