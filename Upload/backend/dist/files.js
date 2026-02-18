"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getAllFiles = (folderPath) => {
    let response = [];
    // 🚫 Skip .git directory entirely
    if (folderPath.includes(`${path_1.default.sep}.git`)) {
        return response;
    }
    const allFilesandFolders = fs_1.default.readdirSync(folderPath);
    allFilesandFolders.forEach((file) => {
        const filePath = path_1.default.join(folderPath, file);
        // 🚫 Skip anything inside .git
        if (filePath.includes(`${path_1.default.sep}.git`)) {
            return;
        }
        if (fs_1.default.statSync(filePath).isDirectory()) {
            response = response.concat(getAllFiles(filePath));
        }
        else {
            response.push(filePath);
        }
    });
    return response;
};
module.exports = { getAllFiles };
