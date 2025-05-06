import { Provider, ProviderBase, Result, Caps, Channel, Item } from '#tn';
import * as cheerio from "cheerio";
import pLimit from "p-limit";


const BASE_URL = "https://1337x.to";
const SEARCH_DEFAULT = `${BASE_URL}/top-100`;
const TVSEARCH_DEFAULT = `${BASE_URL}/popular-tv`;
const CATEGORY_SEARCH_TEMPLATE = (query: string, category: string, page: number) => `${BASE_URL}/category-search/${query}/${category}/${page}/`;

const CATEGORY_MOVIES = "Movies";
const CATEGORY_TV = "TV";
const CATEGORY_GAMES = "Games";
const CATEGORY_MUSIC = "Music";
const CATEGORY_APPS = "Apps";
const CATEGORY_DOCS = "Documentaries";
const CATEGORY_ANIME = "Anime";
const CATEGORY_XXX = "XXX";
const CATEGORY_OTHER = "Other";

function resolveCategory(cats: string) {
    const categoryId = parseInt(cats.split(",")[0]) || 2000;
    if(categoryId >= 1000 && categoryId <= 1180 || categoryId == 4050) return CATEGORY_GAMES;
    if(categoryId >= 2000 && categoryId <= 2090) return CATEGORY_MOVIES;
    if(categoryId >= 3000 && categoryId <= 3060) return CATEGORY_MUSIC;

    if(categoryId == 5070) return CATEGORY_ANIME;
    if(categoryId == 5080) return CATEGORY_DOCS;
    if(categoryId >= 5000 && categoryId <= 5090) return CATEGORY_TV;

    if(categoryId >= 6000 && categoryId <= 6090) return CATEGORY_XXX;
    if(categoryId >= 4000 && categoryId <= 4070) return CATEGORY_APPS;

    return CATEGORY_OTHER;
}

function convertToBytes(sizeStr: string): number {
    const units = {
        "B": 1,
        "KB": 1024,
        "MB": 1024 ** 2,
        "GB": 1024 ** 3,
        "TB": 1024 ** 4
    };

    const [size, unit] = sizeStr.split(" ");
    const numericSize = parseFloat(size);

    return Math.round(numericSize * units[unit]);
}

const channelInfo = new Channel("1337x", "Bittorrent indexer", "https://1337x.to", "en-us");

async function fetchDetails(torrent: cheerio.Cheerio) {
    const url = torrent.children('a[href^=/torrent/]');
    const title = url.text();
    const href = BASE_URL + url.attr('href');

    const info = await fetch(href);
    const info_text = await info.text();

    const $ = cheerio.load(info_text);

    const magnet = $('a[href*="magnet:?"]').attr('href');
    const info_hash = $('div.infohash-box span').text();

    const torrent_info_lists = $('.torrent-detail-page ul.list');

    let items = torrent_info_lists.eq(0).children('li');

    const category = items.eq(0).children('span').text();
    const type = items.eq(1).children('span').text();
    const lang = items.eq(2).children('span').text();
    const uploader = items.eq(4).find('span a').text();
    const uploader_link = BASE_URL + items.eq(4).find('span a').attr('href');

    items = torrent_info_lists.eq(1).children('li');

    const downloads = items.eq(0).children('span').text();
    const last_checked = items.eq(1).children('span').text();
    const date_uploaded = items.eq(2).children('span').text();

    return {
        title, url, href,
        magnet, info_hash,
        category, type, lang, uploader, uploader_link,
        downloads, last_checked, date_uploaded
    };
}

class MyCaps extends Caps.CapsBase {
    constructor() {
        super(
            new Caps.Server("1.0", "title", "...", "url"),
            new Caps.Limits(20, 20),
            new Caps.Registration(true, true),
            [
                new Caps.Search(),
                new Caps.Search("tv-search", true, ["q", "season", "ep"])
            ],
            [
                new Caps.Category(5000, "TV", [
                    new Caps.Category(5040, "TV/HD"),
                    new Caps.Category(5070, "TV/Anime")
                ]),
                new Caps.Category(2000, "Movies", [
                    new Caps.Category(2010, "HD")
                ]),
                new Caps.Category(4000, "PC", [
                    new Caps.Category(4050, "PC/Games")
                ]),
                new Caps.Category(3000, "Audio")
            ]
        );
    }
}

@Provider({ name: "1337x" })
class MyProvider extends ProviderBase {

    torrentList($: cheerio.Root) {
        const torrent_list = $('td.coll-1');
        const seeders_list = $('td.coll-2');
        const leechers_list = $('td.coll-3');
        const size_list = $('td.coll-4');
        const date_list = $('td.coll-date');
        const uploader_list = $('td.coll-5');

        return {
            torrent_list, seeders_list, leechers_list, size_list, date_list, uploader_list
        };
    }

    createItem(info: any) : Item {
        return new Item(
            info.title,
            "short name",
            info.lang,
            true,
            info.href,
            new Date().toUTCString(),
            info.date_uploaded,
            new Date().toUTCString(),
            parseInt(info.downloads, 0),
            info.category,
            2000,
            info.magnet,
            convertToBytes(info.sizeString),
            'application/x-bittorrent;x-scheme-handler/magnet',
            info.seeds,
            info.peers,
            info.type,
            info.info_hash,
            info.uploader,
            info.uploader_link
        );
    }

    async _search(url: string) : Promise<Result> {
        const res = await fetch(url);
        if(res.status !== 200) {
            return new Result(res);
        }

        const text = await res.text();
        const $ = cheerio.load(text);

        const { torrent_list, seeders_list, leechers_list, size_list, date_list, uploader_list } = this.torrentList($);
        const limit = pLimit(3); // Limit to 3 parallel requests

        const promises = torrent_list.map((index, torrent) => limit(async () => {
            const {
                title, url, href,
                magnet, info_hash,
                category, type, lang, uploader, uploader_link,
                downloads, last_checked, date_uploaded
            } = await fetchDetails($(torrent));

            const seeds = parseInt(seeders_list.eq(index).text(), 0);
            const peers = parseInt(leechers_list.eq(index).text(), 0);
            const sizeString = size_list.eq(index).contents().first().text();

            return this.createItem({
                title, lang, href, date_uploaded, downloads, category, magnet, sizeString, seeds, peers, type, info_hash, uploader, uploader_link
            });
        }));

        const results = await Promise.allSettled(promises);

        const items = [];
        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                items.push(result.value);
            } else {
                console.error(`Failed to fetch:`, result.reason);
            }
        });
    
        const result = new Result(res, channelInfo, items);
        return result;
    }

    async search(req: any): Promise<Result> {
        const { q, cat } = req.query;
        const category = resolveCategory(cat);
        const url = q ? CATEGORY_SEARCH_TEMPLATE(q, category, 1) : SEARCH_DEFAULT;
        const res = await this._search(url);
        return res;
    }

    async tvsearch(query: any) : Promise<Result> {
        const { q } = query;
        const url = q ? CATEGORY_SEARCH_TEMPLATE(q, 'TV', 1) : TVSEARCH_DEFAULT;
        const res = await this._search(url);
        return res;
    }
}

export { MyProvider as provider, MyCaps as caps }
