import os from 'os';
import { URL } from 'url';

import { Helper } from './interfaces';
import wrapInCollapse from './wrapInCollapse';

export default (): Helper => (config): string => {

	const url = new URL(config.url);
	const markdown = [
// eslint-disable-next-line @typescript-eslint/indent
`<div align="center">
    <iframe width="852" height="315" src="${url.toString()}" frameborder="0"></iframe>
</div>`
	];
	return wrapInCollapse(markdown, url.toString(), url.toString()).join(os.EOL);
};
