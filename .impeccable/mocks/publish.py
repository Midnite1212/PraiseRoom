"""Build a single-file, publishable copy of a mock page (shared CSS and JS inlined).

Usage: python3 -I publish.py final/ripple-out-songs.html <out.html>
The artifact skeleton supplies doctype/html/head/body, so those tags are stripped.
The doc chrome gets dark tokens; frames keep their own theme classes.
"""
import re, sys, pathlib
src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
root = src.parent
h = src.read_text()
def inline_css(m):
    return '<style>\n' + (root / m.group(1)).read_text() + '\n</style>'
def inline_js(m):
    return '<script>\n' + (root / m.group(1)).read_text() + '\n</script>'
h = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, h)
h = re.sub(r'<script src="([^"]+)"></script>', inline_js, h)
title = re.search(r'<title>.*?</title>', h).group(0)
h = re.sub(r'<!doctype html>|</?html[^>]*>|</?head>|<meta [^>]*>|<title>.*?</title>', '', h)
h = h.replace('<body class="doc">', '<div class="doc">').replace('</body>', '</div>')
h = re.sub(r'<nav class="topnav">\$\{nav\}</nav>', '', h)
PUB = """<style>
/* publish shell: theme-aware doc chrome, no horizontal page scroll */
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --doc-bg: #0B121D; --doc-text: #E8EEF6; --doc-muted: #A3B2C6; --doc-rule: #26364F; --doc-chip: #22385A; --doc-chip-text: #B6CDEA; --doc-chip-on: #B6CDEA; --doc-chip-on-text: #16294A; --doc-cap: #A3B2C6; color-scheme: dark; } }
:root[data-theme="dark"] { --doc-bg: #0B121D; --doc-text: #E8EEF6; --doc-muted: #A3B2C6; --doc-rule: #26364F; --doc-chip: #22385A; --doc-chip-text: #B6CDEA; --doc-chip-on: #B6CDEA; --doc-chip-on-text: #16294A; --doc-cap: #A3B2C6; color-scheme: dark; }
body { background: var(--doc-bg); color: var(--doc-text); }
.doc { background: var(--doc-bg); color: var(--doc-text); font-family: var(--sans); font-weight: 300; }
.doc .page { width: auto; max-width: 1720px; padding-block: 32px 64px; padding-inline: max(16px, 3vw); }
.doc .row { overflow-x: auto; padding-bottom: 8px; }
.doc figure { flex: none; }
.doc .ph h1 { font-size: clamp(32px, 5vw, 44px); }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
</style>"""
out.write_text(title + '\n' + h.strip() + '\n' + PUB + '\n')
print('built', out, len(out.read_text()), 'bytes')
