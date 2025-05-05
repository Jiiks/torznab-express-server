import { __filename, __dirname } from '#constants'
import { render } from '#renderer'
import providers from '#providers'
import { item } from '#torznab'

const providerInstances = {};

providerInstances["1337x"] = new providers["1337x"].Provider();

//console.log(providerInstances["1337x"]);

//getProvider("1337x").then(provider => {});

const provider = providerInstances["1337x"];

const data = {
    items: [new item(
        "TITLE", "SHORT_NAME", true, "LINK", "PUB_DATE", "RAW_DATE", "LAST_CHECKED", 15000, "CATEGORY", "MAGNET", 5987543, "CONTENT_TYPE", 7444, 54355, 2010, "TYPE", "INFO_HASH"
    )
    ]
}

const output = render("feed", data);

console.log(output);

