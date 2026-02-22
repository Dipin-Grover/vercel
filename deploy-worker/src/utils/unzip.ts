import fs from "fs";
import unzipper from "unzipper";

export async function unzipFile(zipPath: string, extractPath: string) {
  return fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractPath }))
    .promise();
}