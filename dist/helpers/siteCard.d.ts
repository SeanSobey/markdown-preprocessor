/// <reference types="node" />
import { URL } from 'url';
import { Helper } from './interfaces';
declare const _default: (cacheFolderPath: string | null) => Helper;
export default _default;
export declare function fetchSiteMeta(url: URL, cacheFolderPath: string | null): Promise<{
    readonly [key: string]: any;
}>;
