import os from 'os';
import { URL } from 'url';

import { Helper } from './interfaces';
import wrapInCollapse from '../util/wrapInCollapse';
import { cacheData } from '../util/cacheData';
import request from 'request';

import uuidv4 from 'uuid/v4';

interface VideoMeta {
	readonly author_name: string;
	readonly provider_name: string;
	readonly title: string;
	readonly html: string;
	readonly provider_url: string;
	readonly thumbnail_url: string;
	readonly version: string;
	readonly author_url: string;
	readonly type: 'video';
	readonly thumbnail_height: number;
	readonly thumbnail_width: number;
	readonly height: number;
	readonly width: number;
}

const random: ReadonlyArray<number> = [
	0x10, 0x91, 0x56, 0xbe, 0xc4, 0xfb, 0xc1, 0xea,
	0x71, 0xb4, 0xef, 0xe1, 0x67, 0x1c, 0x58, 0x36
];
const youtubeIcon = 'https://s.ytimg.com/yts/img/favicon-vfl8qSV2F.ico';

export default (cacheFolderPath: string | null, proxy: string | null): Helper => async (config): Promise<string> => {

	const videoId = uuidv4({ random });
	const key: string | null = config.key;
	const url: string | null = config.url;
	const videoUrl = new URL(key
		? `https://www.youtube.com/watch?v=${key}`
		// ? `https://youtu.be/${key}`
		: url || 'no url provided');
	const videoKey = videoUrl.searchParams.get('v');
	const meta = await fetchVideoMeta(videoUrl, cacheFolderPath, proxy);
	const timestamps: ReadonlyArray<string> | null = config.timestamps;
	const collapse: boolean | null = config.collapse;
	const width = config.width || meta.width;
	const height = config.height || meta.height;
	const markdown = [
// eslint-disable-next-line @typescript-eslint/indent
`<div align="center">
    <script type="text/javascript">
        window.YouTubeIframeAPIReadyCallbacks.push(() => {
            window.YouTubePlayers['${videoId}'] = new YT.Player('${videoId}');
        });
    </script>
    <iframe id="${videoId}" width="${width}" height="${height}" src="https://www.youtube.com/embed/${videoKey}?enablejsapi=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`
	];
	if (timestamps) {
		markdown.push(
`<table align="center">
    <tr>
        <th>Time</th>
        <th>Note</th>
    </tr>`);
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
		// TODO: these styles are site specific!
		const collapseSummary = `<img src="${youtubeIcon}">${config.collapseSummary || meta.title}`;
		const cite: string = meta.author_name;
		return wrapInCollapse(markdown, collapseSummary, cite).join(os.EOL);
	}
	return markdown.join(os.EOL);
};

async function fetchVideoMeta(url: URL, cacheFolderPath: string | null, proxy: string | null): Promise<VideoMeta> {

	const urlString = `http://www.youtube.com/oembed?url=${ url.toString()}&format=json`;
	const options: request.CoreOptions = {
		proxy,
		headers: {
			'user-agent': 'node.js',
		},
		json: true
	};
	const requestAsync = (): Promise<VideoMeta> => new Promise((resolve, reject) => request(urlString, options, (error, _response, responseBody) => {
		if (error) {
			return reject(error);
		}
		resolve(responseBody);
	}));
	if (!cacheFolderPath) {
		return requestAsync();
	}
	return cacheData(cacheFolderPath, encodeURIComponent(urlString) + '.json', () => requestAsync());
}
