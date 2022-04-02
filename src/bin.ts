#!/usr/bin/env node
//@ts-check
'use-strict';

import yargs from 'yargs';
import { Preprocessor } from './index';

const argv = yargs
	.options({
		'src': {
			demand: true,
			describe: 'The source folder for your markdown.',
			alias: 's',
			type: 'string',
		},
		'exclude-pattern': {
			default: null,
			demand: false,
			describe: 'Optional exclude glob patterns to ignore in the source dir.',
			type: 'array',
		},
		'dest': {
			demand: true,
			describe: 'The destination folder for your processed markdown.',
			alias: 'd',
			type: 'string',
		},
		'home-url': {
			default: '/',
			demand: false,
			describe: 'The absolute or relative link for home url links to direct to, eg "https://example.com/" or "/Documents/".',
			type: 'string',
		},
		'generate-index': {
			default: false,
			describe: 'Generate index.md files for all directories.',
			demand: true,
			type: 'boolean',
		},
		'remove-link-fileext': {
			default: false,
			describe: 'Remove file extensions (.md) from links, for better Github Pages compatibility.',
			demand: true,
			type: 'boolean',
		},
		'site-cache-path': {
			default: null,
			describe: 'Path to cache site metadata, if not specified then no caching will be performed.',
			demand: false,
			type: 'string',
		},
		'custom-script-path': {
			default: null,
			describe: 'Path to custom script path to include.',
			demand: false,
			type: 'string',
		},
		'custom-style-path': {
			default: null,
			describe: 'Path to custom style path to include.',
			demand: false,
			type: 'string',
		},
		'proxy': {
			default: null,
			describe: 'Proxy to send outgoing requests through.',
			demand: false,
			type: 'string',
		},
		'helpers': {
			default: null,
			describe: 'Glob for JS files for custom gitdown [helpers](https://github.com/gajus/gitdown#syntax-register-a-custom-helper). Should have a default export of an object `{ name: string, weight: number, compile: () => Helper }`, see `/src/helpers`',
			demand: false,
			type: 'string',
		},
		'verbose': {
			default: false,
			describe: 'Verbose logging.',
			demand: false,
			type: 'boolean',
		},
		'ignoreError': {
			default: false,
			describe: 'Ignore error with processing a file.',
			demand: false,
			type: 'boolean',
		},
	})
	.strict()
	.config()
	.argv;

async function main(): Promise<void> {

	/* eslint-disable dot-notation */
	const preprocessor = new Preprocessor({
		srcDir: argv['src'],
		excludePattern: (argv['exclude-pattern'] || [] as Array<string>).map((s) => s.toString()),
		destDir: argv['dest'],
		homeUrl: argv['home-url'],
		siteCachePath: argv['site-cache-path'],
		customScriptPath: argv['custom-script-path'],
		customStylePath: argv['custom-style-path'],
		proxy: argv['proxy'],
		generateIndex: argv['generate-index'],
		removeLinkFileext: argv['remove-link-fileext'],
		helpers: argv['helpers'],
		verbose: argv['verbose'],
		ignoreError: argv['ignoreError']
	});
	/* eslint-enable dot-notation */
	await preprocessor.execute();
}

main()
	.then(() => console.log('done'))
	.catch((error) => console.error('failed', error));
