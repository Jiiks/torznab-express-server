import { Result } from "#tn";

import "reflect-metadata";
function provider(config: { name: string }) {
    return function (target: Function) {
        Reflect.defineMetadata("providerName", config.name, target);
    };
}

abstract class ProviderBase {
    __name: String;
    abstract search(query: any) : Promise<Result>;
}

export { ProviderBase, provider as Provider };
