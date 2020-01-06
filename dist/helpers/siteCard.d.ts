/// <reference types="node" />
import { URL } from 'url';
import mkdirp from 'mkdirp';
import { Helper } from './interfaces';
declare const _default: (cacheFolderPath: mkdirp.Made) => Helper;
export default _default;
export declare function fetchSiteMeta(url: URL, cacheFolderPath: string | null): Promise<{
    readonly [key: string]: any;
}>;
