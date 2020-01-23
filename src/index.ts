import util from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

import themeHelperFactory from './helpers/theme';
import navigationHeaderHelperFactory from './helpers/navigationHeader';
import navigationFooterHelperFactory from './helpers/navigationFooter';
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
	readonly proxy: string | null;
	readonly generateIndex: boolean;
	readonly removeLinkFileext: boolean;
	readonly helpers: string | null;
	readonly verbose: boolean;
}

export class Preprocessor {

	private readonly _srcDir: string;
	private readonly _excludePattern: ReadonlyArray<string>;
	private readonly _destDir: string;
	private readonly _homeUrl: string;
	private readonly _siteCachePath: string | null;
	private readonly _proxy: string | null;
	private readonly _generateIndex: boolean;
	private readonly _removeLinkFileExtension: boolean;
	private readonly _helpers: string | null;
	private readonly _verbose: boolean;

	public constructor(config: PreprocessorConfig) {

		this._srcDir = config.srcDir;
		this._excludePattern = config.excludePattern || [];
		this._destDir = config.destDir;
		this._homeUrl = config.homeUrl.endsWith('/') ? config.homeUrl : config.homeUrl + '/';
		this._siteCachePath = config.siteCachePath;
		this._proxy = config.proxy;
		this._generateIndex = config.generateIndex;
		this._removeLinkFileExtension = config.removeLinkFileext;
		this._helpers = config.helpers;
		this._verbose = config.verbose;
	}

	public async execute(): Promise<void> {

		this.log('Executing', {
			srcDir: this._srcDir,
			destDir: this._destDir,
			homeUrl: this._homeUrl,
			excludePattern: this._excludePattern,
			siteCachePath: this._siteCachePath,
			proxy: this._proxy,
			generateIndex: this._generateIndex,
			removeLinkFileext: this._removeLinkFileExtension,
			helpers: this._helpers,
			verbose: this._verbose,
		});
		this.log('Cleaning dest path', this._destDir);
		await rimrafAsync(path.join(this._destDir, '**', '*.md'));
		this.log('Globbing src paths', this._srcDir);
		const filesByDirectory = await this._createDestDirectoryMap(path.resolve(this._srcDir));
		const pattern = [path.join(this._srcDir, '**', '*.md'), ...this._excludePattern];
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

		const destFilePathObj = path.parse(destFilePath);
		await mkdirpAsync(destFilePathObj.dir);
		const gitdownFile = gitdown.readFile(srcFilePath);
		//const config = gitdownFile.getConfig();
		gitdownFile.registerHelper('theme', {
			weight: 10,
			compile: themeHelperFactory(),
		});
		gitdownFile.registerHelper('navigation:header', {
			weight: 101,
			compile: navigationHeaderHelperFactory(destFilePathObj.name, this._removeLinkFileExtension, this._homeUrl), // !isRoot, true, !isRoot
		});
		gitdownFile.registerHelper('navigation:footer', {
			weight: 102,
			compile: navigationFooterHelperFactory(this._removeLinkFileExtension, this._homeUrl), // !isRoot, true, !isRoot
		});
		gitdownFile.registerHelper('video:youtube', {
			weight: 10,
			compile: videoYoutubeHelperFactory(),
		});
		gitdownFile.registerHelper('site:card', {
			weight: 10,
			compile: siteCardHelperFactory(this._siteCachePath, this._proxy),
		});
		gitdownFile.registerHelper('site:embed', {
			weight: 10,
			compile: siteEmbedHelperFactory(),
		});
		gitdownFile.registerHelper('image', {
			weight: 10,
			compile: imageHelperFactory(),
		});
		if (this._helpers) {
			const helpers = await globby(this._helpers, {});
			for (const helperPath of helpers) {
				const helper = await import(path.resolve(helperPath));
				if (typeof helper.name !== 'string') {
					throw new Error('Helper needs to export an object with a \'name\' string.');
				}
				if (typeof helper.weight !== 'number') {
					throw new Error('Helper needs to export an object with a \'weight\' number.');
				}
				if (typeof helper.compile !== 'function') {
					throw new Error('Helper needs to export an object with a \'compile\' function.');
				}
				this.log('Registering custom helper', { name: helper.name, weight: helper.weight });
				gitdownFile.registerHelper(helper.name, {
					weight: helper.weight,
					compile: helper.compile,
				});
			}
		}
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
		await gitdownFile.writeFile(destFilePath);
	}

	private async createIndexFile(directory: string, filesForDirectory: ReadonlyArray<string>): Promise<void> {

		await mkdirpAsync(directory);
		const directoryPathObj = path.parse(directory);
		const contents = [];
		const subDirectories = await this.getSubDirectories(directory);
		for (const subDirectory of subDirectories) {
			const pathObj = path.parse(subDirectory);
			contents.push(`📁 [${pathObj.name}](${encodeURIComponent(pathObj.base)}/index${this._removeLinkFileExtension ? '' : '.md'})${lineBreak}`);
		}
		contents.push('');
		for (const file of filesForDirectory) {
			const pathObj = path.parse(file);
			contents.push(`📄 [${pathObj.name}](${encodeURIComponent(this._removeLinkFileExtension ? pathObj.name : pathObj.base)})${lineBreak}`);
		}
		const isRoot = path.resolve(directory) === path.resolve(this._destDir);
		const theme = await themeHelperFactory()({});
		const header = await navigationHeaderHelperFactory(directoryPathObj.base, this._removeLinkFileExtension, this._homeUrl)({ up: !isRoot, back: false, home: !isRoot });
		const footer = await navigationFooterHelperFactory(this._removeLinkFileExtension, this._homeUrl)({ up: !isRoot, back: false, home: !isRoot });
		const markdown = [
			theme,
			header,
			os.EOL,
			...contents,
			footer,
		].join(os.EOL);
		const markdownFilePath = path.join(directory, 'index.md');
		await fs.promises.writeFile(markdownFilePath, markdown, 'utf8');
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
