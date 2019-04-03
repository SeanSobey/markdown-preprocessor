"use strict";
//@ts-check
'use-strict';
Object.defineProperty(exports, "__esModule", { value: true });
const os = require('os');
const { URL } = require('url');
const wrapInCollapse = require('./wrapInCollapse');
exports.default = () => (config) => {
    const url = new URL(config.url);
    const markdown = [
        `<div align="center">
    <iframe width="852" height="315" src="${url.toString()}" frameborder="0"></iframe>
</div>`
    ];
    return wrapInCollapse(markdown, url.toString(), url.toString()).join(os.EOL);
};
//# sourceMappingURL=siteEmbed.js.map