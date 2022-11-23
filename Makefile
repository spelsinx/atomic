# Generate build directory with builded bundle.
build:
	npm run build

# Run build directory an localhost:3000.
run:
	npx serve build

# Runs all actions.
all:
	npm run build
	npx serve build

# !bin.
.PHONY: build