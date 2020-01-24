"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const url_1 = require("url");
const wrapInCollapse_1 = tslib_1.__importDefault(require("../util/wrapInCollapse"));
const cacheData_1 = require("../util/cacheData");
const request_1 = tslib_1.__importDefault(require("request"));
const v4_1 = tslib_1.__importDefault(require("uuid/v4"));
const random = [
    0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea,
    0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36
];
const youtubeIcon = 'https://s.ytimg.com/yts/img/favicon-vfl8qSV2F.ico';
exports.default = (cacheFolderPath, proxy) => async (config) => {
    const videoId = v4_1.default({ random });
    const key = config.key;
    const url = config.url;
    const videoUrl = new url_1.URL(key
        ? `https://www.youtube.com/watch?v=${key}`
        // ? `https://youtu.be/${key}`
        : url || 'no url provided');
    const videoKey = videoUrl.searchParams.get('v');
    const meta = await fetchVideoMeta(videoUrl, cacheFolderPath, proxy);
    const timestamps = config.timestamps;
    const collapse = config.collapse;
    const width = config.width || meta.width;
    const height = config.height || meta.height;
    const markdown = [
        // eslint-disable-next-line @typescript-eslint/indent
        `<div align="center">
    <script type="text/javascript">
        window.YouTubeIframeAPIReadyCallbacks.push(() => {
            window.YouTubePlayers['${videoId}'] = new YT.Player('${videoId}');
        });
    </script>
    <iframe id="${videoId}" width="${width}" height="${height}" src="https://www.youtube.com/embed/${videoKey}?enablejsapi=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`
    ];
    if (timestamps) {
        markdown.push(`<table align="center">
    <tr>
        <th>Time</th>
        <th>Note</th>
    </tr>`);
        // Note: wanted to use an object { [timestamp]: note }, but gitdown does noy support nested objects
        for (const timestampAndNote of Object.values(timestamps)) {
            const [timestamp, note] = timestampAndNote.split(':');
            if (!timestamp || !note) {
                throw new Error(`Invalid youtube timestamp note '${timestampAndNote}', expected format 'XXmXXs:note'`);
            }
            const timestampRegex = /(?:(\d+)m)*(?:(\d+)s)*/;
            const timestampRegexMatch = timestampRegex.exec(timestamp);
            if (!timestampRegexMatch) {
                throw new Error(`Invalid youtube timestamp '${timestamp}', expected format 'XXmXXs'`);
            }
            const timestampUrl = new url_1.URL(videoUrl.toString());
            timestampUrl.searchParams.set('t', timestamp);
            const minutes = parseInt(timestampRegexMatch[1] || '0', 10);
            const seconds = parseInt(timestampRegexMatch[2] || '0', 10);
            const seekTo = (minutes * 60) + seconds;
            markdown.push(`    <tr>
        <td><button onclick="window.YouTubePlayers['${videoId}'].seekTo(${seekTo})">${timestamp}</button> <a href="${timestampUrl}"><i class="fas fa-external-link-alt"></i></a></td>
        <td>${note}</td>
    </tr>`);
        }
        markdown.push(`</table>`);
    }
    if (collapse) {
        // TODO: these styles are site specific!
        const collapseSummary = `<img src="${youtubeIcon}" style="margin-right: 10px; margin-left: -10px; vertical-align: text-top;">${config.collapseSummary || meta.title}`;
        const cite = meta.author_name;
        return wrapInCollapse_1.default(markdown, collapseSummary, cite).join(os_1.default.EOL);
    }
    return markdown.join(os_1.default.EOL);
};
async function fetchVideoMeta(url, cacheFolderPath, proxy) {
    const urlString = `http://www.youtube.com/oembed?url=${url.toString()}&format=json`;
    const options = {
        proxy,
        headers: {
            'user-agent': 'node.js',
        },
        json: true
    };
    const requestAsync = () => new Promise((resolve, reject) => request_1.default(urlString, options, (error, _response, responseBody) => {
        if (error) {
            return reject(error);
        }
        resolve(responseBody);
    }));
    if (!cacheFolderPath) {
        return requestAsync();
    }
    return cacheData_1.cacheData(cacheFolderPath, encodeURIComponent(urlString) + '.json', () => requestAsync());
}
//# sourceMappingURL=videoYoutube.js.map