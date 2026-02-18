"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadDeployment = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const aws_1 = require("./aws");
const downloadDeployment = async (deploymentId) => {
    const bucket = process.env.AWS_BUCKET_NAME;
    const prefix = `output/${deploymentId}/`;
    const list = await aws_1.s3
        .listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
    })
        .promise();
    if (!list.Contents || list.Contents.length === 0) {
        console.log("No files found in S3 for this deployment");
        return false;
    }
    for (const file of list.Contents) {
        if (!file.Key)
            continue;
        const data = await aws_1.s3
            .getObject({
            Bucket: bucket,
            Key: file.Key,
        })
            .promise();
        const relativePath = file.Key.replace(prefix, "");
        const localPath = path_1.default.join(__dirname, "../../workspace/deployments", deploymentId, relativePath);
        fs_1.default.mkdirSync(path_1.default.dirname(localPath), { recursive: true });
        fs_1.default.writeFileSync(localPath, data.Body);
        console.log("Downloaded:", relativePath);
    }
    console.log("Deployment downloaded successfully");
    return true;
};
exports.downloadDeployment = downloadDeployment;
