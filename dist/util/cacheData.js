"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const util_1 = tslib_1.__importDefault(require("util"));
const fs_1 = require("fs");
const mkdirp_1 = tslib_1.__importDefault(require("mkdirp"));
const mkdirpAsync = util_1.default.promisify(mkdirp_1.default);
async function cacheData(cacheFolderPath, fileName, getData) {
    await mkdirpAsync(cacheFolderPath);
    const filePath = path_1.default.join(cacheFolderPath, fileName);
    try {
        const file = await fs_1.promises.readFile(filePath, 'utf8');
        return JSON.parse(file);
    }
    catch (error) {
        if (error.errno !== -4058) {
            throw error;
        }
        const data = await getData();
        const file = JSON.stringify(data);
        await fs_1.promises.writeFile(filePath, file, 'utf8');
        return data;
    }
}
exports.cacheData = cacheData;
//# sourceMappingURL=cacheData.js.map