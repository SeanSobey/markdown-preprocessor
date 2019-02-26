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
const table = require('markdown-table');

const rimrafAsync = util.promisify(rimraf);
const mkdirpAsync = util.promisify(mkdirp);
const globAsync = util.promisify(glob);

const lineBreak = os.EOL + '';

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
		markdown.push('');
		markdown.push(timestampsTable);
	}
	if (config.collapse) {
		return wrapInCollapse(markdown, config.collapseSummary || url.toString(), url.toString()).join(os.EOL);
	}
	return markdown.join(os.EOL);
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

/**
 * @param {Object} config
 * @return {string|Promise<string>}
 */
function siteEmbedHelper(config) {

	const url = new URL(config.url);
	const markdown = [
`<div align="center">
    <iframe width="852" height="315" src="${url.toString()}" frameborder="0"></iframe>
</div>`
	];
	return wrapInCollapse(markdown, url.toString(), url.toString()).join(os.EOL);
}

/**
 * 
 * @param {Array<string>} lines 
 * @param {string} summary 
 * @param {string} cite 
 * @return {Array<string>}
 */
function wrapInCollapse(lines, summary, cite) {
	return [
`<details>
    <summary>${summary}</summary>
    <blockquote cite="${cite}" style="padding-top:2px;padding-bottom:2px;">
        ${lines.join(os.EOL)}
    </blockquote>
</details>`
	];
}

class Preprocessor {

	/**
	 * @param {string} srcDir 
	 * @param {string} destDir 
	 * @param {boolean} generateIndex 
	 * @param {boolean} generateHeader 
	 * @param {boolean} generateFooter 
	 * @param {boolean} removeLinkFileext 
	 * @param {boolean} verbose 
	 */
	constructor(srcDir, destDir, generateIndex, generateHeader, generateFooter, removeLinkFileext, verbose) {

		this._srcDir = srcDir;
		this._destDir = destDir;
		this._generateIndex = generateIndex;
		this._generateHeader = generateHeader;
		this._generateFooter = generateFooter;
		this._removeLinkFileext = removeLinkFileext;
		this._verbose = verbose;
	}

	async execute() {

		this._log('Executing', {
			generateIndex: this._generateIndex,
			generateHeader: this._generateHeader,
			generateFooter: this._generateFooter,
			removeLinkFileext: this._removeLinkFileext,
		});
		this._log('Cleaning dest path', this._destDir);
		await rimrafAsync(path.join(this._destDir, '**', '*.md'));
		this._log('Globbing src path', this._srcDir);
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
				this._log('Processing markdown', {
					src: srcFilePath,
					dest: destFilePath,
				});
				return this._processMarkdown(srcFilePath, destFilePath);
			});
		await Promise.all(processMarkdownPromises);
		if (this._generateIndex) {
			const createIndexFilePromises = Array.from(filesByDirectory.keys())
				.map((directory) => {
					const filesForDirectory = filesByDirectory.get(directory);
					this._log('Creating index file', directory);
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

		const gitdownFile = gitdown.readFile(srcFilePath);
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
		const destFilePathObj = path.parse(destFilePath);
		await mkdirpAsync(destFilePathObj.dir);
		await gitdownFile.writeFile(destFilePath);
		if (!this._generateHeader && !this._generateFooter) {
			return;
		}
		const isRoot = destFilePathObj.dir === path.resolve(this._destDir);
		const contents = await fs.promises.readFile(destFilePath, 'utf8');
		const scripts = this._createScripts();
		const styles = this._createStyles();
		const header = this._generateHeader ? this._createHeader(destFilePathObj.name) : [];
		const footer = this._generateFooter ? this._createFooter(!isRoot, true, !isRoot) : [];
		const markdown = [
			...header,
			...scripts,
			...styles,
			contents,
			...footer
		].join(os.EOL);
		await fs.promises.writeFile(destFilePath, markdown, 'utf8');
	}

	/**
	 * @param {string} directory
	 * @param {Array<string>} filesForDirectory
	 * @return {Promise<void>}
	 */
	async _createIndexFile(directory, filesForDirectory) {

		await mkdirpAsync(directory);
		const directoryPathObj = path.parse(directory);
		const contents = [];
		const subDirectories = await this._getSubDirectories(directory);
		for (const subDirectory of subDirectories) {
			const pathObj = path.parse(subDirectory);
			contents.push(`📁 [${pathObj.name}](${encodeURIComponent(pathObj.base)}/index${this._removeLinkFileext ? '' : '.md'})${lineBreak}`);
		}
		contents.push('');
		for (const file of filesForDirectory) {
			const pathObj = path.parse(file);
			contents.push(`📄 [${pathObj.base}](${encodeURIComponent(pathObj.base)})${lineBreak}`);
		}
		const isRoot = path.resolve(directory) === path.resolve(this._destDir);
		const scripts = this._createScripts();
		const styles = this._createStyles();
		const header = this._createHeader(directoryPathObj.base);
		const footer = this._createFooter(!isRoot, false, !isRoot);
		const markdown = [
			...header,
			...scripts,
			...styles,
			...contents,
			...footer,
		].join(os.EOL);
		const markdownFilePath = path.join(directory, `index.md`);
		await fs.promises.writeFile(markdownFilePath, markdown, 'utf8');
	}

	/**
	 * @return {Array<string>}
	 */
	_createScripts() {

		return [
			`<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">${lineBreak}`,
		];
	}

	/**
	 * @return {Array<string>}
	 */
	_createStyles() {

		return [
		];
	}

	/**
	 * @param {string} fileName
	 * @return {Array<string>}
	 */
	_createHeader(fileName) {

		return [
			`# ${fileName}${lineBreak}`,
		];
	}

	/**
	 * @param {boolean} addUp
	 * @param {boolean} addBack
	 * @param {boolean} addHome
	 * @return {Array<string>}
	 */
	_createFooter(addUp, addBack, addHome) {

		const footer = [
			'',
			'---',
		];
		if (addUp) {
			footer.push(`[<i class="fas fa-arrow-circle-up"></i> Up](../index${this._removeLinkFileext ? '' : '.md'})`);
		}
		if (addBack) {
			footer.push(`[<i class="fas fa-arrow-circle-left"></i> Back](index${this._removeLinkFileext ? '' : '.md'})`);
		}
		if (addHome) {
			footer.push(`[<i class="fas fa-home"></i> Home](/index${this._removeLinkFileext ? '' : '.md'})`);
		}
		footer.push(`<a href="#top"><i class="fas fa-asterisk"></i> Top</a>`);
		return footer;
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

	/**
	 * @param {string} message
	 * @param {Array<any>} args
	 */
	_log(message, ...args) {

		if (this._verbose) {

			console.log(message, ...args);
		}
	}
}

module.exports = Preprocessor;