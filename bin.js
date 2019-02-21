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
			demand: true,
			type: 'boolean',
		},
	})
	.strict()
	.argv;

async function main() {

	const preprocessor = new Preprocessor(argv.src, argv.dest, argv['generate-index']);
	await preprocessor.execute();
}

main()
	.then(() => console.log('done'))
	.catch((error) => console.error('failed', error));