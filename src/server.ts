import express from "express"
import config from './config.json' with { type: "json" };
const servercfg = config.server;

const server = express();
const PORT = 3000;

server.use((req, res, next) => {
    res.setHeader("Content-Type", "text/xml");
    next();
});

export { server, servercfg };
