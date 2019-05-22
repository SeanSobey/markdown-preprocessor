"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
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
        this._generateHeader = config.generateHeader;
        this._generateFooter = config.generateFooter;
        this._removeLinkFileext = config.removeLinkFileext;
        this._verbose = config.verbose;
    }
    async execute() {
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
        const gitdownFile = gitdown_1.default.readFile(srcFilePath);
        //const config = gitdownFile.getConfig();
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
        const destFilePathObj = path_1.default.parse(destFilePath);
        await mkdirpAsync(destFilePathObj.dir);
        await gitdownFile.writeFile(destFilePath);
        if (!this._generateHeader && !this._generateFooter) {
            return;
        }
        const isRoot = destFilePathObj.dir === path_1.default.resolve(this._destDir);
        const contents = await fs_1.default.promises.readFile(destFilePath, 'utf8');
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
        ].join(os_1.default.EOL);
        await fs_1.default.promises.writeFile(destFilePath, markdown, 'utf8');
    }
    async createIndexFile(directory, filesForDirectory) {
        await mkdirpAsync(directory);
        const directoryPathObj = path_1.default.parse(directory);
        const contents = [];
        const subDirectories = await this.getSubDirectories(directory);
        for (const subDirectory of subDirectories) {
            const pathObj = path_1.default.parse(subDirectory);
            contents.push(`📁 [${pathObj.name}](${encodeURIComponent(pathObj.base)}/index${this._removeLinkFileext ? '' : '.md'})${lineBreak}`);
        }
        contents.push('');
        for (const file of filesForDirectory) {
            const pathObj = path_1.default.parse(file);
            contents.push(`📄 [${pathObj.name}](${encodeURIComponent(this._removeLinkFileext ? pathObj.name : pathObj.base)})${lineBreak}`);
        }
        const isRoot = path_1.default.resolve(directory) === path_1.default.resolve(this._destDir);
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
        ].join(os_1.default.EOL);
        const markdownFilePath = path_1.default.join(directory, `index.md`);
        await fs_1.default.promises.writeFile(markdownFilePath, markdown, 'utf8');
    }
    createScripts() {
        return [
            `<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css" integrity="sha384-fnmOCqbTlWIlj8LyTjo7mOUStjsKC4pOpQbqyi7RrhN7udi9RwhKkMHpvLbHG9Sr" crossorigin="anonymous">${lineBreak}`,
        ];
    }
    createStyles() {
        return [];
    }
    createHeader(fileName, addUp, addBack, addHome) {
        const header = [
            `<span name="header"></span>`,
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
        header.push(`<a href="#footer"><i class="fas fa-asterisk"></i> Bottom</a>`);
        return header;
    }
    createFooter(addUp, addBack, addHome) {
        const footer = [
            '',
            '---',
            `<span name="footer"></span>`,
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
        footer.push(`<a href="#header"><i class="fas fa-asterisk"></i> Top</a>`);
        return footer;
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