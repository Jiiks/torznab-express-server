import { __filename, __dirname } from '#constants';
import { Item, render, Channel, Result, ProviderBase } from '#tn';
import { StatusCodes, getStatusCode, getReasonPhrase } from 'http-status-codes';
import { server, servercfg } from './server.ts';
import { default as providers } from './providers/index.mts';
import { Request } from 'express';

interface CustomRequest extends Request {
    provider?: ProviderBase; // Adjust the type to match your provider structure
    caps?: object
}

server.use("/api/v1/:providername", (req: CustomRequest, res, next) => {
    const { providername } = req.params;
    if(providers[providername] === undefined) {
        console.log("Provider does not exist:", providername);
        const error = {
            code: 404,
            message: `Provider not found`,
            details: `Provider '${providername}' does not exist`,
            timestamp: new Date().toISOString()
        };
        res.status(404).send(render("error", error));
        return;
    }

    if(providers[providername].__instance === undefined) {
        const pi = new providers[providername].provider();
        pi.__name = providername;
        providers[providername].__instance = pi;
        providers[providername].__caps = new providers[providername].caps();
    }

    req.provider = providers[providername].__instance;
    req.caps = providers[providername].__caps;
    next();
});

server.get('/api/v1/:provider', async (req: CustomRequest, res) => {
    const { q, t } = req.query;
    const { provider, caps } = req;
    console.log(caps);
    if(t === 'caps') {
        res.set(200).send(render("caps", caps)); return;
    }
    if(t === 'search') {
        const result = await provider.search({ q });
        const { response, channel, items } = result;
        if(response.status !== 200) {
            console.log(response.status);
            res.set(response.status).send(render("error", {
                code: response.status,
                message: response.statusText,
                details: response.statusText,
                timestamp: new Date().toISOString()
            }));
            return;
        }
        res.set(response.status).send(render("feed", { channel, items }));
        return;
    }

    res.send(`<provider name="${provider.__name}"><query t="${t}" q="${q}"></query></provider>`);
});

server.listen(servercfg.port, () => {
    console.log(`Torznab Express server running at http://localhost:${servercfg.port}`);
});

