const http = require("http");
const fs = require("fs");
const path = require("path");

const port = Number(process.env.PORT || 5173);
const root = path.resolve(__dirname);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".bmp": "image/bmp",
  ".png": "image/png",
  ".webm": "video/webm",
  ".ttf": "font/ttf",
  ".wav": "audio/wav",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    const reqPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const relative = reqPath === "/" ? "index.html" : reqPath.replace(/^\/+/, "");
    const full = path.resolve(root, relative);

    if (!full.startsWith(root + path.sep) && full !== root) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.readFile(full, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      const ext = path.extname(full).toLowerCase();
      res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`Menu prototype: http://localhost:${port}`);
  });
