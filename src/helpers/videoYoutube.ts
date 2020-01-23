import os from 'os';
import { URL } from 'url';

import { Helper } from './interfaces';
import wrapInCollapse from './wrapInCollapse';
import  uuidv4 from 'uuid/v4';

export default (): Helper => (config): string => {

	const key: string | null = config.key;
	const url: string | null = config.url;
	const timestamps: ReadonlyArray<string> | null = config.timestamps;
	const collapse: boolean | null = config.collapse;
	const collapseSummary: string | null = config.collapseSummary;

	const videoId = uuidv4();
	const videoUrl = new URL(key
		? `https://www.youtube.com/watch?v=${key}`
		// ? `https://youtu.be/${key}`
		: url || 'no url provided');
	const videoKey = videoUrl.searchParams.get('v');
	const markdown = [
// eslint-disable-next-line @typescript-eslint/indent
`<div align="center">
    <script type="text/javascript">
        window.YouTubeIframeAPIReadyCallbacks.push(() => {
            window.YouTubePlayers['${videoId}'] = new YT.Player('${videoId}');
        });
    </script>
    <iframe id="${videoId}" width="560" height="315" src="https://www.youtube.com/embed/${videoKey}?enablejsapi=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`
	];
	if (timestamps) {
		markdown.push(
`<table align="center">
    <tr>
        <th>Time</th>
        <th>Note</th>
    </tr>`
);
		// Note: wanted to use an object { [timestamp]: note }, but gitdown does noy support nested objects
		for (const timestampAndNote of Object.values(timestamps)) {
			const [timestamp, note] = timestampAndNote.split(':');
			if (!timestamp || !note) {
				throw new Error(`Invalid youtube timestamp note '${timestampAndNote}', expected format 'XXmXXs:note'`);
			}
			const timestampRegex = /(?:(\d+)m)*(?:(\d+)s)*/;
			const timestampRegexMatch = timestampRegex.exec(timestamp);
			if (!timestampRegexMatch) {
				throw new Error(`Invalid youtube timestamp '${timestamp}', expected format 'XXmXXs'`);
			}
			const timestampUrl = new URL(videoUrl.toString());
			timestampUrl.searchParams.set('t', timestamp);
			const minutes = parseInt(timestampRegexMatch[1] || '0', 10);
			const seconds = parseInt(timestampRegexMatch[2] || '0', 10);
			const seekTo = (minutes * 60) + seconds;
			markdown.push(
`    <tr>
        <td><button onclick="window.YouTubePlayers['${videoId}'].seekTo(${seekTo})">${timestamp}</button> <a href="${timestampUrl}"><i class="fas fa-external-link-alt"></i></a></td>
        <td>${note}</td>
    </tr>`);
		}
		markdown.push(`</table>`);
	}
	if (collapse) {
		return wrapInCollapse(markdown, collapseSummary || videoUrl.toString(), videoUrl.toString()).join(os.EOL);
	}
	return markdown.join(os.EOL);
};
