#!/usr/bin/env node
//@ts-check
'use-strict';

const yargs = require('yargs');
const Preprocessor = require('./index');

const argv = yargs
	.options({
		'src': {
			demand: true,
			describe: 'The source folder for your markdown.',
			alias: 's',
			type: 'string',
		},
		'dest': {
			demand: true,
			describe: 'The destination folder for your processed markdown.',
			alias: 'd',
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
			default: true,
			describe: 'Remove file extensions (.md) from links, for better Github Pages compatibility.',
			demand: true,
			type: 'boolean',
		},
	})
	.strict()
	.argv;

async function main() {

	const preprocessor = new Preprocessor(argv.src, argv.dest, argv['generate-index'], argv['generate-header'], argv['generate-footer'], argv['remove-link-fileext']);
	await preprocessor.execute();
}

main()
	.then(() => console.log('done'))
	.catch((error) => console.error('failed', error));