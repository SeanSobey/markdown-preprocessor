import os from 'os';
import { URL } from 'url';
import { Options } from 'request';
import fetchMeta from 'fetch-meta';

import wrapInCollapse from '../util/wrapInCollapse';
import { Helper } from './interfaces';
import { cacheData } from '../util/cacheData';

type SiteMeta = { readonly [key: string]: any };

export default (cacheFolderPath: string | null, proxy: string | null): Helper => async (config): Promise<string> => {

	const url = new URL(config.url);
	const collapse: boolean = config.collapse !== undefined ? config.collapse : false;
	const meta = await fetchSiteMeta(url, cacheFolderPath, proxy);
	// https://searchenginewatch.com/2018/06/15/a-guide-to-html-and-meta-tags-in-2018/
	// https://placeholder.com/
	const description = meta['og:description'] || meta['summary:description'] || meta.description || '';
	const title = meta['og:title'] || meta['summary:title'] || meta.title || '';
	const favicon = meta['summary:favicon'] || meta['link:icon'] || '';
	const image = meta['og:image'] || meta['summary:image'] || '';
	const markdown = [
// eslint-disable-next-line @typescript-eslint/indent
`<div>
    <img src="${favicon}" width="16" height="16" alt="Site Icon">
    <i>${url.host}</i>
</div>
<div>
    <a href="${url.toString()}">
        <b>${title}</b>
    </a>
</div>
<div>
    ${description}
</div>
<div>
    <img src="${image}" alt="Site Image">
</div>`
	];
	if (collapse) {
		const collapseSummary = url.toString();
		const cite = url.toString();
		return wrapInCollapse(markdown, collapseSummary, cite).join(os.EOL);
	}
	return [
		'<section>',
		...markdown,
		'</section>'
	].join(os.EOL);
};

export function fetchSiteMeta(url: URL, cacheFolderPath: string | null, proxy: string | null): Promise<SiteMeta> {

	const urlString = url.toString();
	const options: Options = {
		proxy,
		uri: urlString,
		headers: {
			'user-agent': 'node.js',
		},
		rejectUnauthorized: false
	};
	const fetchMetaAndError = () => {
		return fetchMeta(options)
			.catch((error: Error) => {
				throw new FetchMetaError(error, options);
			});
	};
	if (!cacheFolderPath) {
		return fetchMetaAndError();
	}
	return cacheData(cacheFolderPath, encodeURIComponent(urlString) + '.json', fetchMetaAndError);
}

class FetchMetaError extends Error {

	public innerError: Error;
	public options: Options;

	constructor(error: Error, options: Options) {

		super('Error with fetchMeta');
		this.innerError = error;
		this.options = options;
	}
}
