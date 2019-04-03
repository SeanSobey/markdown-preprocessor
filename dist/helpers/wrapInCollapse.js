"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
exports.default = (lines, summary, cite) => {
    return [
        `<details>
    <summary>${summary}</summary>
    <blockquote cite="${cite}" style="padding-top:2px;padding-bottom:2px;">
        ${lines.join(os_1.default.EOL)}
    </blockquote>
</details>`
    ];
};
//# sourceMappingURL=wrapInCollapse.js.map