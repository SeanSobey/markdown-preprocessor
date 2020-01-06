import util from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

import videoYoutubeHelperFactory from './helpers/videoYoutube';
import siteCardHelperFactory from './helpers/siteCard';
import siteEmbedHelperFactory from './helpers/siteEmbed';
import imageHelperFactory from './helpers/image';

import gitdown from 'gitdown';
import globby from 'globby';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';

const rimrafAsync = util.promisify(rimraf);
const mkdirpAsync = util.promisify(mkdirp);

const lineBreak = os.EOL + '';

// https://help.bit.ai/power-links-rich-embed-integrations/rich-media-embed-integrations

interface PreprocessorConfig {
	readonly srcDir: string;
	readonly excludePattern: ReadonlyArray<string> | null;
	readonly destDir: string;
	readonly homeUrl: string;
	readonly siteCachePath: string | null;
	readonly generateIndex: boolean;
	readonly generateHeader: boolean;
	readonly generateFooter: boolean;
	readonly removeLinkFileext: boolean;
	readonly verbose: boolean;
}

export class Preprocessor {

	private readonly _srcDir: string;
	private readonly _excludePattern: ReadonlyArray<string>;
	private readonly _destDir: string;
	private readonly _homeUrl: string;
	private readonly _siteCachePath: string | null;
	private readonly _generateIndex: boolean;
	private readonly _generateHeader: boolean;
	private readonly _generateFooter: boolean;
	private readonly _removeLinkFileext: boolean;
	private readonly _verbose: boolean;

	public constructor(config: PreprocessorConfig) {

		this._srcDir = config.srcDir;
		this._excludePattern = config.excludePattern || [];
		this._destDir = config.destDir;
		this._homeUrl = config.homeUrl.endsWith('/') ? config.homeUrl : config.homeUrl + '/';
		this._siteCachePath = config.siteCachePath;
		this._generateIndex = config.generateIndex;
		this._generateHeader = config.generateHeader;
		this._generateFooter = config.generateFooter;
		this._removeLinkFileext = config.removeLinkFileext;
		this._verbose = config.verbose;
	}

	public async execute(): Promise<void> {

		this.log('Executing', {
			srcDir: this._srcDir,
			excludePattern: this._excludePattern,
			destDir: this._destDir,
			homeUrl: this._homeUrl,
			generateIndex: this._generateIndex,
			generateHeader: this._generateHeader,
			generateFooter: this._generateFooter,
			removeLinkFileext: this._removeLinkFileext,
		});
		this.log('Cleaning dest path', this._destDir);
		await rimrafAsync(path.join(this._destDir, '**', '*.md'));
		this.log('Globbing src paths', this._srcDir);
		const filesByDirectory = await this._createDestDirectoryMap(path.resolve(this._srcDir));
		const pattern = [path.join(this._srcDir, '**', '*.md'), ...this._excludePattern ];
		const srcFileGlobs = await globby(pattern, {});
		for (const srcFileGlob of srcFileGlobs) {
			const srcFilePath = path.resolve(srcFileGlob);
			const destFilePath = this.createDestPath(srcFilePath);
			const destFilePathObj = path.parse(destFilePath);
			const directory = destFilePathObj.dir + path.sep;
			const files = filesByDirectory.get(directory);
			if (!files) {
				throw new Error(`Could not find files for directory: ${directory}`);
			}
			files.push(destFilePath);
			this.log('Processing markdown', {
				src: srcFilePath,
				dest: destFilePath,
			});
			await this.processMarkdown(srcFilePath, destFilePath);
		}
		if (this._generateIndex) {
			const createIndexFilePromises = Array.from(filesByDirectory.keys())
				.sort()
				.map((directory) => {
					const filesForDirectory = filesByDirectory.get(directory);
					if (!filesForDirectory) {
						throw new Error(`Could not find files for directory: ${directory}`);
					}
					filesForDirectory.sort();
					this.log('Creating index file', directory);
					return this.createIndexFile(directory, filesForDirectory);
				});
			await Promise.all(createIndexFilePromises);
		}
	}

	private createDestPath(srcPath: string): string {

		return srcPath.replace(path.resolve(this._srcDir), path.resolve(this._destDir));
		// const pathObj = path.parse(srcFilePath);
		// const newPathObj = Object.assign({}, pathObj, {
		// 	dir: pathObj.dir.replace(path.resolve(this._srcDir), path.resolve(this._destDir)),
		// });
		// return newPathObj;
	}

	// eslint-disable-next-line functional/prefer-readonly-type
	private async _createDestDirectoryMap(rootDir: string): Promise<Map<string, Array<string>>> {

		const directoryMap = new Map<string, Array<string>>();
		const createDestPath = this.createDestPath.bind(this);
		const getSubDirectories = this.getSubDirectories.bind(this);

		directoryMap.set(createDestPath(rootDir) + path.sep, []);

		async function walk(dir: string): Promise<void> {
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

	private async processMarkdown(srcFilePath: string, destFilePath: string): Promise<void> {

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
		gitdownFile.registerHelper('image', {
			weight: 10,
			compile: imageHelperFactory(),
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
		});
		const destFilePathObj = path.parse(destFilePath);
		await mkdirpAsync(destFilePathObj.dir);
		await gitdownFile.writeFile(destFilePath);
		if (!this._generateHeader && !this._generateFooter) {
			return;
		}
		const isRoot = destFilePathObj.dir === path.resolve(this._destDir);
		const contents = await fs.promises.readFile(destFilePath, 'utf8');
		const scripts = this.createScripts();
		const styles = this.createStyles();
		const header = this._generateHeader ? this.createHeader(destFilePathObj.name, !isRoot, true, !isRoot) : [];
		const footer = this._generateFooter ? this.createFooter(!isRoot, true, !isRoot) : [];
		const markdown = [
			...header,
			...scripts,
			...styles,
			contents,
			...footer
		].join(os.EOL);
		await fs.promises.writeFile(destFilePath, markdown, 'utf8');
	}

	private async createIndexFile(directory: string, filesForDirectory: ReadonlyArray<string>): Promise<void> {

		await mkdirpAsync(directory);
		const directoryPathObj = path.parse(directory);
		const contents = [];
		const subDirectories = await this.getSubDirectories(directory);
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
		const scripts = this.createScripts();
		const styles = this.createStyles();
		const header = this.createHeader(directoryPathObj.base, !isRoot, false, !isRoot);
		const footer = this.createFooter(!isRoot, false, !isRoot);
		const markdown = [
			...header,
			...scripts,
			...styles,
			...contents,
			...footer,
		].join(os.EOL);
		const markdownFilePath = path.join(directory, 'index.md');
		await fs.promises.writeFile(markdownFilePath, markdown, 'utf8');
	}

	private createScripts(): ReadonlyArray<string> {

		return [
			`<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">${lineBreak}`,
		];
	}

	private createStyles(): ReadonlyArray<string> {

		return [
		];
	}

	private createHeader(fileName: string, addUp: boolean, addBack: boolean, addHome: boolean): ReadonlyArray<string> {

		const header = [
			'<span name="header"></span>',
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
		header.push('<a href="#footer"><i class="fas fa-asterisk"></i> Bottom</a>');
		return header;
	}

	private createFooter(addUp: boolean, addBack: boolean, addHome: boolean): ReadonlyArray<string> {

		const footer = [
			'',
			'---',
			'<span name="footer"></span>',
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
		footer.push('<a href="#header"><i class="fas fa-asterisk"></i> Top</a>');
		return footer;
	}

	private async getSubDirectories(rootDirPath: string): Promise<ReadonlyArray<string>> {

		const directories = [];
		const files: ReadonlyArray<fs.Dirent> = await fs.promises.readdir(rootDirPath, {
			withFileTypes: true
		} as any) as any;
		for (const file of files) {
			if (file.isDirectory()) {
				directories.push(path.join(rootDirPath, file.name));
			}
		}
		directories.sort();
		return directories;
	}

	private log(message: string, ...args: ReadonlyArray<any>): void {

		if (this._verbose) {

			console.log(message, ...args);
		}
	}
}
