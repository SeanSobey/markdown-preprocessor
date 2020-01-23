"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const url_1 = require("url");
const wrapInCollapse_1 = tslib_1.__importDefault(require("./wrapInCollapse"));
const v4_1 = tslib_1.__importDefault(require("uuid/v4"));
exports.default = () => (config) => {
    const key = config.key;
    const url = config.url;
    const timestamps = config.timestamps;
    const collapse = config.collapse;
    const collapseSummary = config.collapseSummary;
    const random = [
        0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea,
        0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36
    ];
    const videoId = v4_1.default({ random });
    const videoUrl = new url_1.URL(key
        ? `https://www.youtube.com/watch?v=${key}`
        // ? `https://youtu.be/${key}`
        : url || 'no url provided');
    const videoKey = videoUrl.searchParams.get('v');
    const markdown = [
        // eslint-disable-next-line @typescript-eslint/indent
        `<div align="center">
    <script type="text/javascript">
        window.YouTubeIframeAPIReadyCallbacks.push(() => {
            window.YouTubePlayers['${videoId}'] = new YT.Player('${videoId}');
        });
    </script>
    <iframe id="${videoId}" width="560" height="315" src="https://www.youtube.com/embed/${videoKey}?enablejsapi=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
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
        return wrapInCollapse_1.default(markdown, collapseSummary || videoUrl.toString(), videoUrl.toString()).join(os_1.default.EOL);
    }
    return markdown.join(os_1.default.EOL);
};
//# sourceMappingURL=videoYoutube.js.map