from pathlib import Path
path = Path(r'PROJECT.md')
lines = path.read_text(encoding='utf-8').splitlines()
start = None
for i, line in enumerate(lines):
    if line.strip().lower().startswith('backlog (post-mvp)'):
        start = i + 1
        break
if start is None:
    raise SystemExit('Backlog section not found')
idx = start
while idx < len(lines) and lines[idx].strip():
    if not lines[idx].strip().startswith('-'):
        lines[idx] = f"- {lines[idx].strip()}"
    idx += 1
# continue for subsequent lines until blank? there is blank then more entries - ensure convert until another blank? we already replaced first chunk; need go beyond blank line? there blank then old lines; convert there too
idx = start
while idx < len(lines):
    if lines[idx].strip() == '':
        j = idx + 1
        while j < len(lines) and lines[j].strip():
            if not lines[j].strip().startswith('-'):
                lines[j] = f"- {lines[j].strip()}"
            j += 1
        break
path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
