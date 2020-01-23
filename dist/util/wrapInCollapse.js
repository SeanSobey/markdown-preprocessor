"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
exports.default = (lines, summary, cite) => [
    // eslint-disable-next-line arrow-body-style
    `<details>
		<summary>${summary}</summary>
		<blockquote cite="${cite}" style="padding-top:2px;padding-bottom:2px;">
			${lines.join(os_1.default.EOL)}
		</blockquote>
	</details>`
];
//# sourceMappingURL=wrapInCollapse.js.map