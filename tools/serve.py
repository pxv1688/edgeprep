"""Local preview server for Edge that tells the browser to always check for the latest files.

Run from the Edge folder:  python tools/serve.py   then open http://127.0.0.1:8123
"""
import http.server, os, socketserver

PORT = 8123
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), NoCache) as httpd:
    print("Edge preview at http://127.0.0.1:%d" % PORT)
    httpd.serve_forever()
