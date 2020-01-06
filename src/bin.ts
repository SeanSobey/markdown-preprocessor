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
		'generate-header': {
			default: false,
			describe: 'Generate headers for all files.',
			demand: true,
			type: 'boolean',
		},
		'generate-footer': {
			default: false,
			describe: 'Generate footers for all files.',
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
		'verbose': {
			default: false,
			describe: 'Verbose logging.',
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
		generateIndex: argv['generate-index'],
		generateHeader: argv['generate-header'],
		generateFooter: argv['generate-footer'],
		removeLinkFileext: argv['remove-link-fileext'],
		verbose: argv['verbose']
	});
	/* eslint-enable dot-notation */
	await preprocessor.execute();
}

main()
	.then(() => console.log('done'))
	.catch((error) => console.error('failed', error));
