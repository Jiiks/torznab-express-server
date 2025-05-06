import { __filename, __dirname } from '#constants';
import { Item, render, Channel, Result, ProviderBase } from '#tn';
import { StatusCodes, getStatusCode, getReasonPhrase } from 'http-status-codes';
import { server, servercfg, saveCfg } from './server.ts';
import { default as providers } from './providers/index.mts';
import { Request } from 'express';
import readline from 'readline';
import bcrypt from 'bcrypt';
import fs from 'fs';


interface CustomRequest extends Request {
    provider?: ProviderBase; // Adjust the type to match your provider structure
    caps?: object
}

server.use("/api/v1/:providername", (req: CustomRequest, res, next) => {
    console.log('provider query: ', req.query);
    
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

    const ts = t.toString();

    if(provider[ts]) {
        const result: Result = await provider[ts]();
        const { response, channel, items } = result;
        res.set(response.status).send(render("feed", { channel, items }));
        return;
    }

    res.send(`<provider name="${provider.__name}"><query t="${t}" q="${q}"></query></provider>`);
});

server.get('', (req, res) => {
    console.log(req.query);
    res.set(200).send("<ok/>");
});

function start() {
    server.listen(servercfg.port, servercfg.host, () => {
        console.log(`server running at http://${servercfg.host}:${servercfg.port} - available providers:`);
        for(const provider in providers) {
            console.log(`http://${servercfg.host}:${servercfg.port}/api/v${servercfg.version}/${provider}`);
        }
    });
    
}

async function setup() {
    console.log(process.argv);
    if(!fs.existsSync(".env") || process.argv.includes('--reset')) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    
        rl.question("Enter your API Key: ", async(apikey) => {
            if(apikey === '') {
                console.log('No api key provided');
                rl.close();
                start();
                return;
            }
            const hash = await bcrypt.hash(apikey, 10);
            servercfg.apikey = hash;
            fs.writeFile('.env', hash, 'utf-8', () => {
                rl.close();
                start();
            });
        });
        return;
    }

    fs.readFile(".env", 'utf-8', (err, data) => {
        if(err) {
            console.log(err.message);
            return;
        }
        servercfg.apikey = data;
        start();
    });
}

setup();


