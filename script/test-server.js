import http from 'http';
import { parsePkgs, makePages } from '../src/util.js';

const host = '127.0.0.1';
const port = 5001;

(async () => {
    const pkgs = await parsePkgs();
    const pages = Object.fromEntries(makePages(pkgs).map(([url, html]) => [`/${url}`, html]));
    http.createServer((req, res) => {
        if ('/index.json' === req.url) {
            res.setHeader('Content-Type', 'application/json');
            return res.writeHead(200).end(JSON.stringify(pkgs));
        }
        res.setHeader('Content-Type', 'text/html');
        pages[req.url] ?
            res.writeHead(200).end(pages[req.url]) :
            res.writeHead(404).end('Resource not found');
    }).listen({ port, host }, () => console.log(`Server is running on http://${host}:${port}`));
})();
