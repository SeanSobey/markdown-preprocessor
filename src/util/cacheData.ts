import path from 'path';
import util from 'util';
import { promises as fsPromises } from 'fs';

import mkdirp from 'mkdirp';

const mkdirpAsync = util.promisify(mkdirp);

export async function cacheData<T>(cacheFolderPath: string, fileName: string, getData: () => Promise<T>): Promise<T> {

	await mkdirpAsync(cacheFolderPath);
	const filePath = path.join(cacheFolderPath, fileName);
	try {
		const file = await fsPromises.readFile(filePath, 'utf8');
		return JSON.parse(file);
	} catch (error) {
		if (error.errno !== -4058) {
			throw error;
		}
		const data = await getData();
		const file = JSON.stringify(data);
		await fsPromises.writeFile(filePath, file, 'utf8');
		return data;
	}
}
