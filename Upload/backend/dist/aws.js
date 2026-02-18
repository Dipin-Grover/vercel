"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (!process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION) {
    console.error("Missing AWS credentials in .env");
}
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
// local filepath mere device me current directory yani dist me jo github repo clone hui hai simple git se uska path hai
// filename wo path hai jaisa structure of folders and files mai s3 bucket me banana chahta hu because agr yhi se seedhi files gyi to vs code
// ka complex file structure s3 me copy hoga jo nhi chaiye so in s3 we create easier structure
const uploadFile = async (fileName, localFilePath) => {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    const response = await s3
        .upload({
        Body: fileContent,
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
    })
        .promise();
    console.log(response);
};
module.exports = { uploadFile };
