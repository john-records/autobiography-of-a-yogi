#!/usr/bin/env python3
import http.server
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
if __name__ == '__main__':
    http.server.HTTPServer(('0.0.0.0', 8977), H).serve_forever()
