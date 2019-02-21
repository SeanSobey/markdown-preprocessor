//@ts-check
'use-strict';

const util = require('util');
const path = require('path');
const { URL } = require('url');
const fs = require('fs');
const os = require('os');

const fetchMeta = require('fetch-meta').default;
const gitdown = require('gitdown');
const glob = require('glob')
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

const rimrafAsync = util.promisify(rimraf);
const mkdirpAsync = util.promisify(mkdirp);
const globAsync = util.promisify(glob);

// https://help.bit.ai/power-links-rich-embed-integrations/rich-media-embed-integrations

/**
 * @param {Object} config
 * @return {string|Promise<string>}
 */
function videoYoutubeHelper(config) {

	const url = new URL(config.key
		? `https://www.youtube.com/watch?v=${config.key}`
		: config.url);
	const key = url.searchParams.get('v');
	const markdown =
`<div align="center">
	<iframe width="560" height="315" src="https://www.youtube.com/embed/${key}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`;
	return markdown;
}

/**
 * @param {Object} config
 * @return {Promise<string>}
 */
async function siteCardHelper(config) {
	
	const url = new URL(config.url);
	const meta = await fetchMeta({
		uri: url.toString(),
	});
	// https://searchenginewatch.com/2018/06/15/a-guide-to-html-and-meta-tags-in-2018/
	// https://placeholder.com/
	const description = meta['og:description'] || meta['summary:description'] || meta.description || '';
	const title = meta['og:title'] || meta['summary:title'] || meta.title || '';
	const favicon = meta['summary:favicon'] || meta['link:icon'] || '';
	const image = meta['og:image'] || meta['summary:image'] || '';
	const markdown =
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
</details>`;
	return markdown;
}

/**
 * @param {Object} config
 * @return {string|Promise<string>}
 */
function siteEmbedHelper(config) {

	const url = new URL(config.url);
	const markdown =
`<details>
	<summary>${url.toString()}</summary>
	<blockquote cite="${url.toString()}" style="padding-top:2px;padding-bottom:2px;">
		<div align="center">
			<iframe width="852" height="315" src="${url.toString()}" frameborder="0"></iframe>
		</div>
	</blockquote>
</details>`;
		return markdown;
}

/**
 * @param {Object} config
 * @return {string|Promise<string>}
 */
function navigationHelper(config) {

	return [
		`---`,
		`🔺 [Up](../index.md)`
	].join(os.EOL);
}

class Preprocessor {

	/**
	 * @param {string} srcDir 
	 * @param {string} destDir 
	 * @param {boolean} generateIndex 
	 */
	constructor(srcDir, destDir, generateIndex) {

		this._srcDir = srcDir;
		this._destDir = destDir;
		this._generateIndex = generateIndex;
	}

	async execute() {
			
		// Clean
		await rimrafAsync(path.join(this._destDir, '**', '*.md'));
		const srcFileGlobs = await globAsync(path.join(this._srcDir, '**', '*.md'), {});
		const srcFilePaths = srcFileGlobs
			.map((srcFileGlob) => path.resolve(srcFileGlob));
		/**@type {Map<string, Array<string>>}*/
		const filesByDirectory = new Map();
		const processMarkdownPromises = srcFilePaths
		.map((srcFilePath) => {
			const pathObj = path.parse(srcFilePath);
			const newPathObj = Object.assign({}, pathObj, {
				dir: pathObj.dir.replace(path.resolve(this._srcDir), path.resolve(this._destDir)),
			});
			const destFilePath = path.format(newPathObj);
			const directory = newPathObj.dir + path.sep;
			if (!filesByDirectory.has(directory)) {
				filesByDirectory.set(directory, []);
			}
			filesByDirectory.get(directory).push(destFilePath);
			return this._processMarkdown(srcFilePath, destFilePath);
		});
		await Promise.all(processMarkdownPromises);
		if (this._generateIndex) {
			const createIndexFilePromises = Array.from(filesByDirectory.keys())
				.map((directory) => {
					const filesForDirectory = filesByDirectory.get(directory);
					return this._createIndexFile(directory, filesForDirectory);
				})
			await Promise.all(createIndexFilePromises);
		}
	}
		
	/**
	 * @param {string} srcFilePath
	 * @param {string} destFilePath
	 * @return {Promise<void>}
	 */
	async _processMarkdown(srcFilePath, destFilePath) {

		const gitdownFile = gitdown.readFile(path.resolve(srcFilePath));
		//const config = gitdownFile.getConfig();
		gitdownFile.registerHelper('video:youtube', {
			weight: 10,
			compile: videoYoutubeHelper,
		});
		gitdownFile.registerHelper('site:card', {
			weight: 10,
			compile: siteCardHelper,
		});
		gitdownFile.registerHelper('site:embed', {
			weight: 10,
			compile: siteEmbedHelper,
		});
		gitdownFile.registerHelper('navigation', {
			weight: 10,
			compile: navigationHelper,
		});
		gitdownFile.setConfig({
			headingNesting: {
				enabled: false,
			},
			// deadlink: {
			// 	findDeadURLs: true,
			// 	findDeadFragmentIdentifiers: true,
			// },
			variable: {
				scope: {
				},
			},
		})
		const pathObj = path.parse(destFilePath);
		await mkdirpAsync(pathObj.dir);
		await gitdownFile.writeFile(destFilePath);
	}

	/**
	 * @param {string} directory
	 * @param {Array<string>} filesForDirectory
	 * @return {Promise<void>}
	 */
	async _createIndexFile(directory, filesForDirectory) {

		const directoryPathObj = path.parse(directory);
		const markdownLines = [`# ${directoryPathObj.base}`, ''];
		const subDirectories = await this._getSubDirectories(directory);
		for (const subDirectory of subDirectories) {
			const pathObj = path.parse(subDirectory);
			markdownLines.push(`📁 [${pathObj.name}](${pathObj.base}/index.md)`);
			markdownLines.push('');
		}
		markdownLines.push('');
		for (const file of filesForDirectory) {
			const pathObj = path.parse(file);
			markdownLines.push(`📄 [${pathObj.base}](${pathObj.base})`);
			markdownLines.push('');
		}
		markdownLines.push('---');
		markdownLines.push(`🔺 [Up](../index.md)`);
		const markdown = markdownLines.join(os.EOL);
		const markdownFilePath = path.join(directory, 'index.md');
		await fs.promises.writeFile(markdownFilePath, markdown, 'utf8');
	}

	/**
	 * @param {string} rootDirPath
	 * @return {Promise<Array<string>>}
	 */
	async _getSubDirectories(rootDirPath) {

		const directories = [];
		const files = await fs.promises.readdir(rootDirPath, { withFileTypes: true });
		for (const file of files) {
			if (file.isDirectory()) {
				directories.push(path.join(rootDirPath, file.name));
			}
		}
		return directories;
	}
}

module.exports = Preprocessor;