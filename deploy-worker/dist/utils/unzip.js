"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unzipFile = unzipFile;
const fs_1 = __importDefault(require("fs"));
const unzipper_1 = __importDefault(require("unzipper"));
async function unzipFile(zipPath, extractPath) {
    return fs_1.default
        .createReadStream(zipPath)
        .pipe(unzipper_1.default.Extract({ path: extractPath }))
        .promise();
}
