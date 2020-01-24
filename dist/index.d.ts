interface PreprocessorConfig {
    readonly srcDir: string;
    readonly excludePattern: ReadonlyArray<string> | null;
    readonly destDir: string;
    readonly homeUrl: string;
    readonly siteCachePath: string | null;
    readonly customScriptPath: string | null;
    readonly customStylePath: string | null;
    readonly proxy: string | null;
    readonly generateIndex: boolean;
    readonly removeLinkFileext: boolean;
    readonly helpers: string | null;
    readonly verbose: boolean;
}
export declare class Preprocessor {
    private readonly _srcDir;
    private readonly _excludePattern;
    private readonly _destDir;
    private readonly _homeUrl;
    private readonly _siteCachePath;
    private readonly _customScriptPath;
    private readonly _customStylePath;
    private readonly _proxy;
    private readonly _generateIndex;
    private readonly _removeLinkFileExtension;
    private readonly _helpers;
    private readonly _verbose;
    constructor(config: PreprocessorConfig);
    execute(): Promise<void>;
    private createDestPath;
    private _createDestDirectoryMap;
    private processMarkdown;
    private createIndexFile;
    private getSubDirectories;
    private log;
}
export {};
