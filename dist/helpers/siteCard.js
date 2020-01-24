"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const url_1 = require("url");
const fetch_meta_1 = tslib_1.__importDefault(require("fetch-meta"));
const wrapInCollapse_1 = tslib_1.__importDefault(require("../util/wrapInCollapse"));
const cacheData_1 = require("../util/cacheData");
exports.default = (cacheFolderPath, proxy) => async (config) => {
    const url = new url_1.URL(config.url);
    const collapse = config.collapse;
    const meta = await fetchSiteMeta(url, cacheFolderPath, proxy);
    // https://searchenginewatch.com/2018/06/15/a-guide-to-html-and-meta-tags-in-2018/
    // https://placeholder.com/
    const description = meta['og:description'] || meta['summary:description'] || meta.description || '';
    const title = meta['og:title'] || meta['summary:title'] || meta.title || '';
    const favicon = meta['summary:favicon'] || meta['link:icon'] || '';
    const image = meta['og:image'] || meta['summary:image'] || '';
    const markdown = [
        // eslint-disable-next-line @typescript-eslint/indent
        `<section>
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
</section>`
    ];
    if (collapse) {
        const collapseSummary = url.toString();
        const cite = url.toString();
        return wrapInCollapse_1.default(markdown, collapseSummary, cite).join(os_1.default.EOL);
    }
    return markdown.join(os_1.default.EOL);
};
function fetchSiteMeta(url, cacheFolderPath, proxy) {
    const urlString = url.toString();
    const options = {
        proxy,
        uri: urlString,
        headers: {
            'user-agent': 'node.js',
        },
    };
    if (!cacheFolderPath) {
        return fetch_meta_1.default(options);
    }
    return cacheData_1.cacheData(cacheFolderPath, encodeURIComponent(urlString) + '.json', () => fetch_meta_1.default(options));
}
exports.fetchSiteMeta = fetchSiteMeta;
//# sourceMappingURL=siteCard.js.map