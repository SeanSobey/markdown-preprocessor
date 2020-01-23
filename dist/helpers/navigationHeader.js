"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const lineBreak = os_1.default.EOL + '';
exports.default = (fileName, removeLinkFileExtension, homeUrl) => (config) => {
    const addUp = config.up;
    const addBack = config.back;
    const addHome = config.home;
    const header = [
        '<span id="header"></span>',
        `# ${fileName}${lineBreak}`,
    ];
    if (addUp) {
        header.push(`[<i class="fas fa-arrow-circle-up"></i> Up](../index${removeLinkFileExtension ? '' : '.md'})`);
    }
    if (addBack) {
        header.push(`[<i class="fas fa-arrow-circle-left"></i> Back](index${removeLinkFileExtension ? '' : '.md'})`);
    }
    if (addHome) {
        header.push(`[<i class="fas fa-home"></i> Home](${homeUrl}index${removeLinkFileExtension ? '' : '.md'})`);
    }
    header.push('<a href="#footer"><i class="fas fa-asterisk"></i> Bottom</a>');
    // if (addUp || addBack || addHome) {
    header.push('', '---');
    // }
    return header.join(os_1.default.EOL);
};
//# sourceMappingURL=navigationHeader.js.map