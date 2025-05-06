import Item from "./item.mts";

class Channel {
    title: String;
    description: String;
    link: String;
    language: String;
    constructor(title: String, description: String, link: String, language: String) {
        this.title = title;
        this.description = description;
        this.link = link;
        this.language = language;
    }
}

class Result {
    channel: Channel;
    items: Item[];
    response: Response;

    constructor(response: Response, channel?: Channel, items: Item[] = []) {
        this.response = response;
        this.channel = channel;
        this.items = items;
    }
}

export { Channel, Result }
