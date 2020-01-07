"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const theme_1 = __importDefault(require("./helpers/theme"));
const navigationHeader_1 = __importDefault(require("./helpers/navigationHeader"));
const navigationFooter_1 = __importDefault(require("./helpers/navigationFooter"));
const videoYoutube_1 = __importDefault(require("./helpers/videoYoutube"));
const siteCard_1 = __importDefault(require("./helpers/siteCard"));
const siteEmbed_1 = __importDefault(require("./helpers/siteEmbed"));
const image_1 = __importDefault(require("./helpers/image"));
const gitdown_1 = __importDefault(require("gitdown"));
const globby_1 = __importDefault(require("globby"));
const rimraf_1 = __importDefault(require("rimraf"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const rimrafAsync = util_1.default.promisify(rimraf_1.default);
const mkdirpAsync = util_1.default.promisify(mkdirp_1.default);
const lineBreak = os_1.default.EOL + '';
class Preprocessor {
    constructor(config) {
        this._srcDir = config.srcDir;
        this._excludePattern = config.excludePattern || [];
        this._destDir = config.destDir;
        this._homeUrl = config.homeUrl.endsWith('/') ? config.homeUrl : config.homeUrl + '/';
        this._siteCachePath = config.siteCachePath;
        this._generateIndex = config.generateIndex;
        this._removeLinkFileExtension = config.removeLinkFileext;
        this._helpers = config.helpers;
        this._verbose = config.verbose;
    }
    async execute() {
        this.log('Executing', {
            srcDir: this._srcDir,
            excludePattern: this._excludePattern,
            destDir: this._destDir,
            homeUrl: this._homeUrl,
            generateIndex: this._generateIndex,
            removeLinkFileext: this._removeLinkFileExtension,
            helpers: this._helpers,
        });
        this.log('Cleaning dest path', this._destDir);
        await rimrafAsync(path_1.default.join(this._destDir, '**', '*.md'));
        this.log('Globbing src paths', this._srcDir);
        const filesByDirectory = await this._createDestDirectoryMap(path_1.default.resolve(this._srcDir));
        const pattern = [path_1.default.join(this._srcDir, '**', '*.md'), ...this._excludePattern];
        const srcFileGlobs = await globby_1.default(pattern, {});
        for (const srcFileGlob of srcFileGlobs) {
            const srcFilePath = path_1.default.resolve(srcFileGlob);
            const destFilePath = this.createDestPath(srcFilePath);
            const destFilePathObj = path_1.default.parse(destFilePath);
            const directory = destFilePathObj.dir + path_1.default.sep;
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
    createDestPath(srcPath) {
        return srcPath.replace(path_1.default.resolve(this._srcDir), path_1.default.resolve(this._destDir));
        // const pathObj = path.parse(srcFilePath);
        // const newPathObj = Object.assign({}, pathObj, {
        // 	dir: pathObj.dir.replace(path.resolve(this._srcDir), path.resolve(this._destDir)),
        // });
        // return newPathObj;
    }
    // eslint-disable-next-line functional/prefer-readonly-type
    async _createDestDirectoryMap(rootDir) {
        const directoryMap = new Map();
        const createDestPath = this.createDestPath.bind(this);
        const getSubDirectories = this.getSubDirectories.bind(this);
        directoryMap.set(createDestPath(rootDir) + path_1.default.sep, []);
        async function walk(dir) {
            const subDirs = await getSubDirectories(dir);
            for (const subDir of subDirs) {
                const directory = createDestPath(subDir) + path_1.default.sep;
                directoryMap.set(directory, []);
                await walk(subDir);
            }
        }
        await walk(rootDir);
        return directoryMap;
    }
    async processMarkdown(srcFilePath, destFilePath) {
        const destFilePathObj = path_1.default.parse(destFilePath);
        await mkdirpAsync(destFilePathObj.dir);
        const gitdownFile = gitdown_1.default.readFile(srcFilePath);
        //const config = gitdownFile.getConfig();
        gitdownFile.registerHelper('theme', {
            weight: 10,
            compile: theme_1.default(),
        });
        gitdownFile.registerHelper('navigation:header', {
            weight: 10,
            compile: navigationHeader_1.default(destFilePathObj.name, this._removeLinkFileExtension, this._homeUrl),
        });
        gitdownFile.registerHelper('navigation:footer', {
            weight: 10,
            compile: navigationFooter_1.default(this._removeLinkFileExtension, this._homeUrl),
        });
        gitdownFile.registerHelper('video:youtube', {
            weight: 10,
            compile: videoYoutube_1.default(),
        });
        gitdownFile.registerHelper('site:card', {
            weight: 10,
            compile: siteCard_1.default(this._siteCachePath),
        });
        gitdownFile.registerHelper('site:embed', {
            weight: 10,
            compile: siteEmbed_1.default(),
        });
        gitdownFile.registerHelper('image', {
            weight: 10,
            compile: image_1.default(),
        });
        if (this._helpers) {
            const helpers = await globby_1.default(this._helpers, {});
            for (const helperPath of helpers) {
                const helper = await Promise.resolve().then(() => __importStar(require(path_1.default.resolve(helperPath))));
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
                scope: {},
            },
        });
        await gitdownFile.writeFile(destFilePath);
    }
    async createIndexFile(directory, filesForDirectory) {
        await mkdirpAsync(directory);
        const directoryPathObj = path_1.default.parse(directory);
        const contents = [];
        const subDirectories = await this.getSubDirectories(directory);
        for (const subDirectory of subDirectories) {
            const pathObj = path_1.default.parse(subDirectory);
            contents.push(`📁 [${pathObj.name}](${encodeURIComponent(pathObj.base)}/index${this._removeLinkFileExtension ? '' : '.md'})${lineBreak}`);
        }
        contents.push('');
        for (const file of filesForDirectory) {
            const pathObj = path_1.default.parse(file);
            contents.push(`📄 [${pathObj.name}](${encodeURIComponent(this._removeLinkFileExtension ? pathObj.name : pathObj.base)})${lineBreak}`);
        }
        const isRoot = path_1.default.resolve(directory) === path_1.default.resolve(this._destDir);
        const theme = await theme_1.default()({});
        const header = await navigationHeader_1.default(directoryPathObj.base, this._removeLinkFileExtension, this._homeUrl)({ up: !isRoot, back: false, home: !isRoot });
        const footer = await navigationFooter_1.default(this._removeLinkFileExtension, this._homeUrl)({ up: !isRoot, back: false, home: !isRoot });
        const markdown = [
            theme,
            header,
            os_1.default.EOL,
            ...contents,
            footer,
        ].join(os_1.default.EOL);
        const markdownFilePath = path_1.default.join(directory, 'index.md');
        await fs_1.default.promises.writeFile(markdownFilePath, markdown, 'utf8');
    }
    async getSubDirectories(rootDirPath) {
        const directories = [];
        const files = await fs_1.default.promises.readdir(rootDirPath, {
            withFileTypes: true
        });
        for (const file of files) {
            if (file.isDirectory()) {
                directories.push(path_1.default.join(rootDirPath, file.name));
            }
        }
        directories.sort();
        return directories;
    }
    log(message, ...args) {
        if (this._verbose) {
            console.log(message, ...args);
        }
    }
}
exports.Preprocessor = Preprocessor;
//# sourceMappingURL=index.js.map