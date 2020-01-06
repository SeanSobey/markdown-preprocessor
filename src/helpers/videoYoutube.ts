import os from 'os';
import { URL } from 'url';

import table from 'markdown-table';

import { Helper } from './interfaces';
import wrapInCollapse from './wrapInCollapse';

export default (): Helper => (config): string => {

	const key: string | null = config.key;
	const url: string | null = config.url;
	const timestamps: ReadonlyArray<string> | null = config.timestamps;
	const collapse: boolean | null = config.collapse;
	const collapseSummary: string | null = config.collapseSummary;

	const videoUrl = new URL(key
		? `https://www.youtube.com/watch?v=${key}`
		// ? `https://youtu.be/${key}`
		: url || 'no url provided');
	const videoKey = videoUrl.searchParams.get('v');
	const markdown = [
// eslint-disable-next-line @typescript-eslint/indent
`<div align="center">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoKey}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`
	];
	if (timestamps) {
		const tableHeader = [ ['Time', 'Note'] ];
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
				const timestampUrl = new URL(videoUrl.toString());
				timestampUrl.searchParams.set('t', timestamp);
				return [`[${timestamp}](${timestampUrl})`, note];
			});
		const tableData = [...tableHeader, ...tableBody];
		const timestampsTable = table(tableData, { start: '    | ' });
		markdown.push('', timestampsTable);
	}
	if (collapse) {
		return wrapInCollapse(markdown, collapseSummary || videoUrl.toString(), videoUrl.toString()).join(os.EOL);
	}
	return markdown.join(os.EOL);
};
