import express from "express"
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import config from './config.json' with { type: "json" };
import { render } from '#tn';
import { Response } from "express-serve-static-core";
const servercfg = config.server;
const server = express();
const PORT = 3000;

function saveCfg() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const fullPath = path.resolve(__dirname, "config.json");
    fs.writeFileSync(fullPath, JSON.stringify(config, null, 4));
}

function sendUnauthorizedError(res: Response<any, Record<string, any>, number>, details: string) {
    res.status(401).send(render("error", {
        code: 401,
        message: "Unauthorized",
        details,
        timestamp: new Date().toISOString()
    }));
}

server.use(async(req, res, next) => {
    res.setHeader("Content-Type", "text/xml");
    // No api key set so access is public
    if(!servercfg.apikey || servercfg.apikey === '') return next();

    const { apikey } = req.query;
    // No api key provided
    if (!apikey) return sendUnauthorizedError(res, "Missing API key");

    const compare = await bcrypt.compare(apikey.toString(), servercfg.apikey);
    // Bad api key
    if (!compare) return sendUnauthorizedError(res, "Bad API key");

    return next();
});

export { server, servercfg, saveCfg };
