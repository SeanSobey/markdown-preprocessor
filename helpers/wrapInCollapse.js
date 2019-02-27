//@ts-check
'use-strict';

const os = require('os');

/**
 * @param {Array<string>} lines 
 * @param {string} summary 
 * @param {string} cite 
 * @return {Array<string>}
 */
module.exports = (lines, summary, cite) => {
	return [
`<details>
    <summary>${summary}</summary>
    <blockquote cite="${cite}" style="padding-top:2px;padding-bottom:2px;">
        ${lines.join(os.EOL)}
    </blockquote>
</details>`
	];
}