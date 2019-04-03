"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const url_1 = require("url");
const wrapInCollapse_1 = __importDefault(require("./wrapInCollapse"));
exports.default = () => (config) => {
    const url = new url_1.URL(config.url);
    const markdown = [
        `<div align="center">
    <iframe width="852" height="315" src="${url.toString()}" frameborder="0"></iframe>
</div>`
    ];
    return wrapInCollapse_1.default(markdown, url.toString(), url.toString()).join(os_1.default.EOL);
};
//# sourceMappingURL=siteEmbed.js.map