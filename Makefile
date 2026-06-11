# Convenience targets. npm scripts are the source of truth (see package.json).

.PHONY: install dev make-qa-ready postman-test clean

install:
	npm install

dev:
	npm run dev

make-qa-ready:
	npm run make:qa-ready

postman-test:
	npm run test:postman

clean:
	rm -rf dist node_modules
