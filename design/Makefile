# Run from design/:   npm install && make
# make        -> artwork prep + every SVG in ../assets + ../README.md   (needs node, python3 + Pillow; cwd-independent)
# make check  -> validator + Chromium previews of the repo root:  make check TOOLS=/path/to/folder-with-validate.py-and-render.mjs
TOOLS ?=
all:
	python3 prep-images.py
	node build.mjs
	node gen-readme.mjs
check: all
	@test -n "$(TOOLS)" || { echo "usage: make check TOOLS=/path/to/validate.py+render.mjs folder"; exit 2; }
	python3 $(TOOLS)/validate.py ..
	node $(TOOLS)/render.mjs readme ../README.md ../final --wait 4500
.PHONY: all check
