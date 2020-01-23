export declare function cacheData<T>(cacheFolderPath: string, fileName: string, getData: () => Promise<T>): Promise<T>;
