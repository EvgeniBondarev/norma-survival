"""Локальный сервер для разработки: отдаёт файлы без кэша, чтобы правки видны сразу.

Запуск из корня проекта:  python3 game/tools/serve.py   (откроется на http://localhost:8765/game/index.html)
"""
import http.server
import os
import socketserver
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


with Server(("", PORT), Handler) as httpd:
    print(f"http://localhost:{PORT}/game/index.html")
    httpd.serve_forever()
