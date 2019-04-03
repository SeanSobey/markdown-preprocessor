"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const url_1 = require("url");
const markdown_table_1 = __importDefault(require("markdown-table"));
const wrapInCollapse_1 = __importDefault(require("./wrapInCollapse"));
exports.default = () => (config) => {
    const key = config.key;
    const url = config.url;
    const timestamps = config.timestamps;
    const collapse = config.collapse;
    const collapseSummary = config.collapseSummary;
    const videoUrl = new url_1.URL(key
        ? `https://www.youtube.com/watch?v=${key}`
        // ? `https://youtu.be/${key}`
        : url || 'no url provided');
    const videoKey = videoUrl.searchParams.get('v');
    const markdown = [
        `<div align="center">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoKey}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`
    ];
    if (timestamps) {
        const tableHeader = [[`Time`, `Note`]];
        // Note: wanted to use an object { [timestamp]: note }, but gitdown does noy support nested objects
        const tableBody = Object.values(timestamps)
            .map((timestampAndNote) => {
            const [timestamp, note] = timestampAndNote.split(':');
            if (!timestamp || !note) {
                throw new Error(`Invalid youtube timestamp note '${timestampAndNote}', expected format 'XXmXXs:note'`);
            }
            const timestampRegex = /(?:(\d+)m)*(?:(\d+)s)*/;
            if (!timestampRegex.test(timestamp)) {
                throw new Error(`Invalid youtube timestamp '${timestamp}', expected format 'XXmXXs'`);
            }
            const timestampUrl = new url_1.URL(videoUrl.toString());
            timestampUrl.searchParams.set('t', timestamp);
            return [`[${timestamp}](${timestampUrl})`, note];
        });
        const tableData = [...tableHeader, ...tableBody];
        const timestampsTable = markdown_table_1.default(tableData, { start: '    | ' });
        markdown.push('', timestampsTable);
    }
    if (collapse) {
        return wrapInCollapse_1.default(markdown, collapseSummary || videoUrl.toString(), videoUrl.toString()).join(os_1.default.EOL);
    }
    return markdown.join(os_1.default.EOL);
};
//# sourceMappingURL=videoYoutube.js.map