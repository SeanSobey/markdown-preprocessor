"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
exports.default = (removeLinkFileExtension, homeUrl) => (config) => {
    const addUp = config.up;
    const addBack = config.back;
    const addHome = config.home;
    const footer = [
        '',
        '---',
        '<span id="footer"></span>',
    ];
    if (addUp) {
        footer.push(`[<i class="fas fa-arrow-circle-up"></i> Up](../index${removeLinkFileExtension ? '' : '.md'})`);
    }
    if (addBack) {
        footer.push(`[<i class="fas fa-arrow-circle-left"></i> Back](index${removeLinkFileExtension ? '' : '.md'})`);
    }
    if (addHome) {
        footer.push(`[<i class="fas fa-home"></i> Home](${homeUrl}index${removeLinkFileExtension ? '' : '.md'})`);
    }
    footer.push('<a href="#header"><i class="fas fa-asterisk"></i> Top</a>');
    return footer.join(os_1.default.EOL);
};
//# sourceMappingURL=navigationFooter.js.map