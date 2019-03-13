//@ts-check
'use-strict';

const os = require('os');
const { URL } = require('url');

const table = require('markdown-table');

const wrapInCollapse = require('./wrapInCollapse');

/**
 * @return {import("./interfaces").Helper}
 */
module.exports = () => {

	return (config) => {

		const url = new URL(config.key
			// ? `https://www.youtube.com/watch?v=${config.key}`
			? `https://youtu.be/${config.key}`
			: config.url);
		const key = url.searchParams.get('v');
		const markdown = [
`<div align="center">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/${key}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`
		];
		if (config.timestamps) {
			const tableHeader = [ [`Time`, `Note`] ];
			// Note: wanted to use an object { [timestamp]: note }, but gitdown does noy support nested objects
			const tableBody = Object.values(config.timestamps)
				.map((timestampAndNote) => {
					const [timestamp, note] = timestampAndNote.split(':');
					if (!timestamp || !note) {
						throw new Error(`Invalid youtube timestamp note '${timestampAndNote}', expected format 'XXmXXs:note'`);
					}
					const timestampRegex = /(?:(\d+)m)*(?:(\d+)s)*/;
					if (!timestampRegex.test(timestamp)) {
						throw new Error(`Invalid youtube timestamp '${timestamp}', expected format 'XXmXXs'`);
					}
					const timestampUrl = new URL(url.toString());
					timestampUrl.searchParams.set('t', timestamp);
					return [`[${timestamp}](${timestampUrl})`, note]
				});
			const tableData = [...tableHeader, ...tableBody];
			const timestampsTable = table(tableData);
			markdown.push('', timestampsTable);
		}
		if (config.collapse) {
			return wrapInCollapse(markdown, config.collapseSummary || url.toString(), url.toString()).join(os.EOL);
		}
		return markdown.join(os.EOL);
	};
}