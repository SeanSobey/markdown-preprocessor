//@ts-check
'use-strict';

const util = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');

const videoYoutubeHelperFactory = require('./helpers/videoYoutube');
const siteCardHelperFactory = require('./helpers/siteCard');
const siteEmbedHelperFactory = require('./helpers/siteEmbed');

const gitdown = require('gitdown');
const glob = require('glob')
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

const rimrafAsync = util.promisify(rimraf);
const mkdirpAsync = util.promisify(mkdirp);
const globAsync = util.promisify(glob);

const lineBreak = os.EOL + '';

// https://help.bit.ai/power-links-rich-embed-integrations/rich-media-embed-integrations

class Preprocessor {

	/**
	 * @param {string} srcDir 
	 * @param {string} destDir 
	 * @param {string} homeUrl 
	 * @param {string} siteCachePath 
	 * @param {boolean} generateIndex 
	 * @param {boolean} generateHeader 
	 * @param {boolean} generateFooter 
	 * @param {boolean} removeLinkFileext 
	 * @param {boolean} verbose 
	 */
	constructor(srcDir, destDir, homeUrl, siteCachePath, generateIndex, generateHeader, generateFooter, removeLinkFileext, verbose) {

		this._srcDir = srcDir;
		this._destDir = destDir;
		this._homeUrl = homeUrl.endsWith('/') ? homeUrl : homeUrl + '/';
		this._siteCachePath = siteCachePath;
		this._generateIndex = generateIndex;
		this._generateHeader = generateHeader;
		this._generateFooter = generateFooter;
		this._removeLinkFileext = removeLinkFileext;
		this._verbose = verbose;
	}

	async execute() {

		this._log('Executing', {
			srcDir: this._srcDir,
			destDir: this._destDir,
			homeUrl: this._homeUrl,
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
			compile: videoYoutubeHelperFactory(),
		});
		gitdownFile.registerHelper('site:card', {
			weight: 10,
			compile: siteCardHelperFactory(this._siteCachePath),
		});
		gitdownFile.registerHelper('site:embed', {
			weight: 10,
			compile: siteEmbedHelperFactory(),
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
		const header = this._generateHeader ? this._createHeader(destFilePathObj.name, !isRoot, true, !isRoot) : [];
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
			contents.push(`📄 [${pathObj.name}](${encodeURIComponent(this._removeLinkFileext ? pathObj.name : pathObj.base)})${lineBreak}`);
		}
		const isRoot = path.resolve(directory) === path.resolve(this._destDir);
		const scripts = this._createScripts();
		const styles = this._createStyles();
		const header = this._createHeader(directoryPathObj.base, !isRoot, false, !isRoot);
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
	 * @param {boolean} addUp
	 * @param {boolean} addBack
	 * @param {boolean} addHome
	 * @return {Array<string>}
	 */
	_createHeader(fileName, addUp, addBack, addHome) {

		const header = [
			`# ${fileName}${lineBreak}`,
		];
		if (addUp) {
			header.push(`[<i class="fas fa-arrow-circle-up"></i> Up](../index${this._removeLinkFileext ? '' : '.md'})`);
		}
		if (addBack) {
			header.push(`[<i class="fas fa-arrow-circle-left"></i> Back](index${this._removeLinkFileext ? '' : '.md'})`);
		}
		if (addHome) {
			header.push(`[<i class="fas fa-home"></i> Home](${this._homeUrl}index${this._removeLinkFileext ? '' : '.md'})`);
		}
		if (addUp || addBack || addHome) {
			header.push('', '---');
		}
		return header;
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
			footer.push(`[<i class="fas fa-home"></i> Home](${this._homeUrl}index${this._removeLinkFileext ? '' : '.md'})`);
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