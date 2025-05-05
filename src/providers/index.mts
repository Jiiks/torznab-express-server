import { pathToFileURL, fileURLToPath } from 'url';
import "reflect-metadata";
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const providersDir = path.resolve(__dirname);
const providers = {};

async function loadProviders() {
    const folders = fs.readdirSync(providersDir);
    
    for (const folder of folders) {
        const providerPath = path.join(providersDir, folder, 'index.mts');
        if (fs.existsSync(providerPath)) {
            console.log("Importing Provider: ", providerPath);
            const fileUrl = pathToFileURL(providerPath).href;
            const imported = await import(fileUrl);

            const { provider, caps } = imported;

            const providerName = Reflect.getMetadata("providerName", provider);
            console.log("Metadata Provider Name: ", providerName);
            

            console.log("Imported Provider:", provider);
            providers[providerName] = { provider, caps }
        }
    }
}

await loadProviders();

export default providers;
