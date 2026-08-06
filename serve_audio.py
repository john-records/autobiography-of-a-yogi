"""Static server that honours Range requests, for previewing the narration.

python -m http.server answers every request with 200 and the whole file. An
<audio> element can play that, but it cannot *seek* in it -- setting
currentTime silently does nothing, and the reader looks broken in a way that
has nothing to do with the page. So the preview needs a server that speaks 206.

Production hosting handles ranges; this exists so local verification tests the
same thing the reader will do.

  python3 serve_audio.py [port] [host]

Binds 127.0.0.1 by default -- this machine only. Pass 0.0.0.0 as the second
argument to reach it from another machine on the LAN. This matters because
"localhost" on the Air is the Air's own loopback and can never see a server
running on the MBP; the Air needs http://192.168.8.135:<port>/ instead.
0.0.0.0 is an unauthenticated server on the home network: start it to look at
something, then stop it.
"""
import http.server, os, re, socketserver, sys

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, fmt, *args):
        pass

    def end_headers(self):
        # No caching in the preview. Without this the browser heuristically
        # caches index.html and serves the previous ?v= script tags, so an edit
        # verified here can be a verification of the OLD file -- which is worse
        # than no verification at all.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        path = self.translate_path(self.path)
        if not m or not os.path.isfile(path):
            return super().send_head()

        size = os.path.getsize(path)
        first, last = m.group(1), m.group(2)
        if first == "":                       # suffix range: last N bytes
            start, end = max(0, size - int(last)), size - 1
        else:
            start = int(first)
            end = int(last) if last else size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        # SimpleHTTPRequestHandler.copyfile() would send to EOF; cap it.
        self.wfile.write(f.read(end - start + 1))
        f.close()
        return None


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8903
    host = sys.argv[2] if len(sys.argv) > 2 else "127.0.0.1"
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True
    with socketserver.ThreadingTCPServer((host, port), Handler) as s:
        where = "localhost" if host == "127.0.0.1" else host
        print(f"http://{where}:{port}/  (Range-capable, bound {host})")
        s.serve_forever()
