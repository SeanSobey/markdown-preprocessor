export declare type Helper = (config: {
    readonly [key: string]: any;
}, context?: HelperContext) => string | Promise<string>;
export interface HelperContext {
    readonly gitdown: any;
    readonly locator: any;
    readonly markdown: string;
    readonly parser: any;
}
