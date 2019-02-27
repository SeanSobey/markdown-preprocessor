//@ts-check
'use-strict';

const os = require('os');
const { URL } = require('url');
const path = require('path');
const util = require('util');
const { promises: fsPromises } = require('fs');

const mkdirp = require('mkdirp');
const fetchMeta = require('fetch-meta').default;

const mkdirpAsync = util.promisify(mkdirp);

/**
 * @param {string | null} cacheFolderPath
 * @return {import("./interfaces").Helper}
 */
module.exports = (cacheFolderPath) => {
	
	return async (config) => {

		const url = new URL(config.url);
		const meta = await fetchSiteMeta(url, cacheFolderPath);
		// https://searchenginewatch.com/2018/06/15/a-guide-to-html-and-meta-tags-in-2018/
		// https://placeholder.com/
		const description = meta['og:description'] || meta['summary:description'] || meta.description || '';
		const title = meta['og:title'] || meta['summary:title'] || meta.title || '';
		const favicon = meta['summary:favicon'] || meta['link:icon'] || '';
		const image = meta['og:image'] || meta['summary:image'] || '';
		const markdown = [
`<details>
    <summary>${url.toString()}</summary>
    <blockquote cite="${url.toString()}" style="padding-top:2px;padding-bottom:2px;">
        <section>
            <img src="${favicon}" width="16" height="16">
            <i>${url.host}</i>
        </section>
        <section>
            <a href="${url.toString()}">
                <b>${title}</b>
            </a>
        </section>
        <section>
            ${description}
        </section>
        <section>
            <img src="${image}">
        </section>
    </blockquote>
</details>`
		];
		return markdown.join(os.EOL);
	}
}

/**
 * @param {URL} url 
 * @param {string | null} cacheFolderPath 
 * @return {Promise<{ [key: string]: any }>}
 */
async function fetchSiteMeta(url, cacheFolderPath) {

	const urlString = url.toString();
	if (!cacheFolderPath) {
		return await fetchMeta({
			uri: urlString,
		});
	}
	await mkdirpAsync(cacheFolderPath);
	const filePath = path.join(cacheFolderPath, encodeURIComponent(urlString)) + '.json';
	try {
		const file = await fsPromises.readFile(filePath, 'utf8');
		return JSON.parse(file);
	} catch (error) {
		
		if (error.errno === -4058) {
			console.log('Cache not found, fetching metadata', {
				path: error.path,
				url: url.toString()
			});
		}
		const metadata = await fetchMeta({
			uri: urlString,
		});
		const file = JSON.stringify(metadata);
		await fsPromises.writeFile(filePath, file, 'utf8');
		return metadata;
	}
}