"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const url_1 = require("url");
const fs_1 = require("fs");
const mkdirp_1 = __importDefault(require("mkdirp"));
const fetch_meta_1 = __importDefault(require("fetch-meta"));
const mkdirpAsync = util_1.default.promisify(mkdirp_1.default);
exports.default = (cacheFolderPath, proxy) => async (config) => {
    const url = new url_1.URL(config.url);
    const meta = await fetchSiteMeta(url, cacheFolderPath, proxy);
    // https://searchenginewatch.com/2018/06/15/a-guide-to-html-and-meta-tags-in-2018/
    // https://placeholder.com/
    const description = meta['og:description'] || meta['summary:description'] || meta.description || '';
    const title = meta['og:title'] || meta['summary:title'] || meta.title || '';
    const favicon = meta['summary:favicon'] || meta['link:icon'] || '';
    const image = meta['og:image'] || meta['summary:image'] || '';
    const markdown = [
        // eslint-disable-next-line @typescript-eslint/indent
        `<details>
    <summary>${url.toString()}</summary>
    <blockquote cite="${url.toString()}" style="padding-top:2px;padding-bottom:2px;">
        <section>
            <img src="${favicon}" width="16" height="16" alt="Site Icon">
            <i>${url.host}</i>
        </section>
        <section>
            <a href="${url.toString()}">
                <b>${title}</b>
            </a>
        </section>
        <section>
            ${description}
        </section>
        <section>
            <img src="${image}" alt="Site Image">
        </section>
    </blockquote>
</details>`
    ];
    return markdown.join(os_1.default.EOL);
};
async function fetchSiteMeta(url, cacheFolderPath, proxy) {
    const urlString = url.toString();
    if (!cacheFolderPath) {
        return await fetch_meta_1.default({
            proxy,
            uri: urlString,
            headers: {
                'user-agent': 'node.js',
            },
        });
    }
    await mkdirpAsync(cacheFolderPath);
    const filePath = path_1.default.join(cacheFolderPath, encodeURIComponent(urlString)) + '.json';
    try {
        const file = await fs_1.promises.readFile(filePath, 'utf8');
        return JSON.parse(file);
    }
    catch (error) {
        if (error.errno === -4058) {
            console.log('Cache not found, fetching metadata', {
                path: error.path,
                url: url.toString()
            });
        }
        const metadata = await fetch_meta_1.default({
            proxy,
            uri: urlString,
            headers: {
                'user-agent': 'node.js',
            },
        });
        const file = JSON.stringify(metadata);
        await fs_1.promises.writeFile(filePath, file, 'utf8');
        return metadata;
    }
}
exports.fetchSiteMeta = fetchSiteMeta;
//# sourceMappingURL=siteCard.js.map