"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const url_1 = require("url");
const wrapInCollapse_1 = tslib_1.__importDefault(require("../util/wrapInCollapse"));
exports.default = () => (config) => {
    const url = new url_1.URL(config.url);
    const markdown = [
        // TODO: Configurable sizes?
        // eslint-disable-next-line @typescript-eslint/indent
        `<div align="center">
    <iframe width="852" height="315" src="${url.toString()}" frameborder="0"></iframe>
</div>`
    ];
    return wrapInCollapse_1.default(markdown, url.toString(), url.toString()).join(os_1.default.EOL);
};
//# sourceMappingURL=siteEmbed.js.map