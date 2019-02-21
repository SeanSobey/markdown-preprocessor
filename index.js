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
	if (config.collapse) {
		return wrapInCollapse(markdown, config.collapseSummary || url.toString(), url.toString());
	}
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
		`<div align="center">
	<iframe width="852" height="315" src="${url.toString()}" frameborder="0"></iframe>
</div>`;
	return wrapInCollapse(markdown, url.toString(), url.toString());
}

/**
 * 
 * @param {string} html 
 * @param {string} summary 
 * @param {string} cite 
 * @return {string}
 */
function wrapInCollapse(html, summary, cite) {
	return (
		`<details>
	<summary>${summary}</summary>
	<blockquote cite="${cite}" style="padding-top:2px;padding-bottom:2px;">
		${html}
	</blockquote>
</details>`);
}

class Preprocessor {

	/**
	 * @param {string} srcDir 
	 * @param {string} destDir 
	 * @param {boolean} generateIndex 
	 * @param {boolean} generateHeader 
	 * @param {boolean} generateFooter 
	 */
	constructor(srcDir, destDir, generateIndex, generateHeader, generateFooter) {

		this._srcDir = srcDir;
		this._destDir = destDir;
		this._generateIndex = generateIndex;
		this._generateHeader = generateHeader;
		this._generateFooter = generateFooter;
	}

	async execute() {

		// Clean
		await rimrafAsync(path.join(this._destDir, '**', '*.md'));
		const srcFileGlobs = await globAsync(path.join(this._srcDir, '**', '*.md'), {});
		const srcFilePaths = srcFileGlobs
			.map((srcFileGlob) => path.resolve(srcFileGlob));
		const filesByDirectory = await this._createDestDirectoryMap(path.resolve(this._srcDir));
		const processMarkdownPromises = srcFilePaths
			.map((srcFilePath) => {
				const destFilePath = this._createDestPath(srcFilePath);
				const destFilePathObj = path.parse(destFilePath);
				const directory = destFilePathObj.dir + path.sep;
				const files = filesByDirectory.get(directory);
				files.push(destFilePath);
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
	 * @param {string} srcPath
	 * @returns {string}
	 */
	_createDestPath(srcPath) {

		return srcPath.replace(path.resolve(this._srcDir), path.resolve(this._destDir));
		// const pathObj = path.parse(srcFilePath);
		// const newPathObj = Object.assign({}, pathObj, {
		// 	dir: pathObj.dir.replace(path.resolve(this._srcDir), path.resolve(this._destDir)),
		// });
		// return newPathObj;
	}

	/**
	 * @param {string} rootDir
	 * @returns {Promise<Map<string, Array<string>>>}
	 */
	async _createDestDirectoryMap(rootDir) {

		/**@type {Map<string, Array<string>>}*/
		const directoryMap = new Map();
		const createDestPath = this._createDestPath.bind(this);
		const getSubDirectories = this._getSubDirectories.bind(this);

		directoryMap.set(createDestPath(rootDir) + path.sep, []);

		async function walk(dir) {
			const subDirs = await getSubDirectories(dir);
			for (const subDir of subDirs) {
				const directory = createDestPath(subDir) + path.sep;
				directoryMap.set(directory, []);
				await walk(subDir);
			}
		}
		await walk(rootDir);
		return directoryMap;
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
		if (!this._generateHeader && !this._generateFooter) {
			return;
		}
		const file = await fs.promises.readFile(destFilePath, 'utf8');
		const scripts = this._createScripts();
		const header = this._generateHeader ? this._createHeader(pathObj.name) : '';
		const footer = this._generateFooter ? this._createFooter() : '';
		const newFile = [scripts, header, file, footer].join(os.EOL);
		await fs.promises.writeFile(destFilePath, newFile, 'utf8');
	}

	/**
	 * @param {string} directory
	 * @param {Array<string>} filesForDirectory
	 * @return {Promise<void>}
	 */
	async _createIndexFile(directory, filesForDirectory) {

		await mkdirpAsync(directory);
		const directoryPathObj = path.parse(directory);
		const markdownLines = [`# ${directoryPathObj.base}`, ''];
		const subDirectories = await this._getSubDirectories(directory);
		for (const subDirectory of subDirectories) {
			const pathObj = path.parse(subDirectory);
			markdownLines.push(`📁 [${pathObj.name}](${encodeURIComponent(pathObj.base)}/index.md)`);
			markdownLines.push('');
		}
		markdownLines.push('');
		for (const file of filesForDirectory) {
			const pathObj = path.parse(file);
			markdownLines.push(`📄 [${pathObj.base}](${encodeURIComponent(pathObj.base)})`);
			markdownLines.push('');
		}
		markdownLines.push(this._createFooter()); // TODO: Ignore if root dir
		const markdown = markdownLines.join(os.EOL);
		const markdownFilePath = path.join(directory, 'index.md');
		await fs.promises.writeFile(markdownFilePath, markdown, 'utf8');
	}

	/**
	 * @return {string}
	 */
	_createScripts() {

		return [
			'<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">',
			''
		].join(os.EOL);
	}

	/**
	 * @param {string} fileName
	 * @return {string}
	 */
	_createHeader(fileName) {

		return [
			`# ${fileName}`,
			''
		].join(os.EOL);
	}

	/**
	 * @return {string}
	 */
	_createFooter() {

		return [
			'---',
			'<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">',
			'',
			`[<i class="fas fa-arrow-circle-up"></i> Up](../index.md)`,
			`[<i class="fas fa-arrow-circle-left"></i> Back](index.md)`,
			`[<i class="fas fa-home"></i> Home](/index.md)`,
			`<a href="#top"><i class="fas fa-asterisk"></i> Top</a>`,
		].join(os.EOL);
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