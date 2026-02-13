import fs from "fs";
import path from "path";

const getAllFiles = (folderPath: string): string[] => {
  let response: string[] = [];

  // 🚫 Skip .git directory entirely
  if (folderPath.includes(`${path.sep}.git`)) {
    return response;
  }

  const allFilesandFolders = fs.readdirSync(folderPath);

  allFilesandFolders.forEach((file) => {
    const filePath = path.join(folderPath, file);

    // 🚫 Skip anything inside .git
    if (filePath.includes(`${path.sep}.git`)) {
      return;
    }

    if (fs.statSync(filePath).isDirectory()) {
      response = response.concat(getAllFiles(filePath));
    } else {
      response.push(filePath);
    }
  });

  return response;
};

module.exports = { getAllFiles };
