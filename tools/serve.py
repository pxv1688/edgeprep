"""Local preview server for Edge that tells the browser to always check for the latest files.

Run from the Edge folder:  python tools/serve.py   then open http://127.0.0.1:8123

It also accepts PUT uploads of generated page bodies from the in-browser page builder
(tools/build_pages.js), but only for files named .impeccable/tpl/gen-*.body.html and only on 127.0.0.1.
"""
import http.server, os, re, socketserver

PORT = 8123
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
ALLOWED = re.compile(r"^/\.impeccable/tpl/gen-[a-z0-9-]+\.body\.html$")

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def do_PUT(self):
        if self.client_address[0] != "127.0.0.1" or not ALLOWED.match(self.path):
            self.send_error(403, "Not allowed")
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length > 2_000_000:
            self.send_error(413, "Too large")
            return
        body = self.rfile.read(length)
        with open(os.path.join(ROOT, self.path.lstrip("/")), "wb") as f:
            f.write(body)
        self.send_response(204)
        self.end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print("Edge preview at http://127.0.0.1:%d" % PORT)
    httpd.serve_forever()
