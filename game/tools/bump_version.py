"""Дописывает ?v=<время> ко всем подключаемым файлам игры, чтобы браузер не держал старые копии.

Любой скрипт или стиль, который браузер кэшировал, перестаёт совпадать по адресу и грузится заново.
Запускать после каждой правки js/css:  python3 -I game/tools/bump_version.py
(serve.py и так отдаёт всё без кэша, а это нужно для любого другого сервера.)
"""
import glob
import os
import re
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
V = str(int(time.time()))

def sub(path, pattern, repl):
    s = open(path, encoding="utf-8").read()
    n = re.sub(pattern, repl, s)
    if n != s:
        open(path, "w", encoding="utf-8").write(n)
    return n != s

changed = []
for p in glob.glob(os.path.join(ROOT, "js", "*.js")):
    # import ... from './x.js' и './x.js?v=...'
    if sub(p, r"(from\s+'\./[A-Za-z0-9_\-]+\.js)(\?v=\d+)?'", rf"\1?v={V}'"):
        changed.append(os.path.basename(p))
    # fetch('img/sprites.json') и подобное
    sub(p, r"fetch\('img/sprites\.json(\?v=\d+)?'\)", f"fetch('img/sprites.json?v={V}')")
sub(os.path.join(ROOT, "index.html"), r'src="js/main\.js(\?v=\d+)?"', f'src="js/main.js?v={V}"')
sub(os.path.join(ROOT, "index.html"), r'href="style\.css(\?v=\d+)?"', f'href="style.css?v={V}"')
print("версия", V, "| обновлены:", ", ".join(changed) or "ничего")
