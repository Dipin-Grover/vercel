"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const IGNORE_FOLDERS = ["node_modules", ".git", ".next", ".cache"];
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
// 🔹 Load env FIRST
dotenv_1.default.config({ path: "./.env" });
// 🔹 Configure AWS FIRST
aws_sdk_1.default.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
// 🔹 Create clients AFTER config
const sqs = new aws_sdk_1.default.SQS();
const s3 = new aws_sdk_1.default.S3();
const dynamoDb = new aws_sdk_1.default.DynamoDB.DocumentClient();
// ===============================
// S3 DOWNLOAD LOGIC
// ===============================
async function downloadFromS3(deploymentId) {
    const baseDir = path_1.default.join("workspace", "source", deploymentId);
    fs_1.default.mkdirSync(baseDir, { recursive: true });
    const objects = await s3.listObjectsV2({
        Bucket: process.env.AWS_BUCKET_NAME,
        Prefix: `output/${deploymentId}/`,
    }).promise();
    if (!objects.Contents || objects.Contents.length === 0) {
        console.log("❌ No files found in S3");
        return;
    }
    for (const obj of objects.Contents) {
        if (!obj.Key || obj.Key.endsWith("/"))
            continue;
        const relativePath = obj.Key.replace(`output/${deploymentId}/`, "");
        const filePath = path_1.default.join(baseDir, relativePath);
        fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
        const file = await s3.getObject({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: obj.Key,
        }).promise();
        fs_1.default.writeFileSync(filePath, file.Body);
    }
    console.log(`✅ Source downloaded for ${deploymentId}`);
}
function detectProjectType(projectPath) {
    if (fs_1.default.existsSync(path_1.default.join(projectPath, "package.json"))) {
        const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(projectPath, "package.json"), "utf-8"));
        if (pkg.dependencies?.next)
            return "nextjs";
        if (pkg.dependencies?.react)
            return "react";
        return "node";
    }
    return "static";
}
// ===============================
// DEPENDENCY INSTALL
// ===============================
function installDependencies(projectPath) {
    console.log("📦 Installing dependencies...");
    (0, child_process_1.execSync)("npm install", {
        cwd: projectPath,
        stdio: "inherit",
    });
    console.log("✅ Dependencies installed");
}
// ===============================
// BUILD PROJECT
// ===============================
function buildProject(projectPath, projectType) {
    console.log("🏗️ Building project...");
    if (projectType === "nextjs") {
        (0, child_process_1.execSync)("npm run build", {
            cwd: projectPath,
            stdio: "inherit",
        });
    }
    if (projectType === "react") {
        (0, child_process_1.execSync)("npm run build", {
            cwd: projectPath,
            stdio: "inherit",
        });
    }
    if (projectType === "node") {
        // Node projects usually don’t need build
        console.log("ℹ️ Node project – skipping build");
    }
    console.log("✅ Build completed");
}
function getBuildFolder(projectPath, projectType) {
    if (projectType === "react") {
        return path_1.default.join(projectPath, "build");
    }
    if (projectType === "static") {
        return projectPath;
    }
    if (projectType === "node") {
        return projectPath; // 👈 THIS IS THE FIX
    }
    return null;
}
async function uploadDirectoryToS3(localDir, s3Prefix) {
    const entries = fs_1.default.readdirSync(localDir);
    for (const entry of entries) {
        // 🔹 Skip heavy folders
        if (IGNORE_FOLDERS.includes(entry)) {
            console.log("⏭️ Skipping:", entry);
            continue;
        }
        const fullPath = path_1.default.join(localDir, entry);
        const s3Key = `${s3Prefix}/${entry}`;
        if (fs_1.default.statSync(fullPath).isDirectory()) {
            await uploadDirectoryToS3(fullPath, s3Key);
        }
        else {
            const fileBuffer = fs_1.default.readFileSync(fullPath);
            await s3.putObject({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: getContentType(entry),
            }).promise();
            console.log("☁️ Uploaded:", s3Key);
        }
    }
}
function getContentType(fileName) {
    if (fileName.endsWith(".html"))
        return "text/html";
    if (fileName.endsWith(".css"))
        return "text/css";
    if (fileName.endsWith(".js"))
        return "application/javascript";
    if (fileName.endsWith(".json"))
        return "application/json";
    if (fileName.endsWith(".png"))
        return "image/png";
    if (fileName.endsWith(".jpg"))
        return "image/jpeg";
    if (fileName.endsWith(".svg"))
        return "image/svg+xml";
    return "application/octet-stream";
}
async function updateDeploymentStatus(deploymentId, status) {
    await dynamoDb.update({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: { id: deploymentId },
        UpdateExpression: "set #status = :status",
        ExpressionAttributeNames: {
            "#status": "status",
        },
        ExpressionAttributeValues: {
            ":status": status,
        },
    }).promise();
    console.log(`📊 Status updated: ${deploymentId} → ${status}`);
}
// ===============================
// SQS POLLING
// ===============================
async function pollQueue() {
    const params = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10,
    };
    const data = await sqs.receiveMessage(params).promise();
    if (!data.Messages || data.Messages.length === 0) {
        console.log("⏳ No messages");
        return;
    }
    for (const message of data.Messages) {
        const deploymentId = message.Body;
        console.log("📦 Received deployment:", deploymentId);
        await updateDeploymentStatus(deploymentId, "building");
        const projectPath = path_1.default.join("workspace", "source", deploymentId);
        // 🔽 DOWNLOAD SOURCE
        await downloadFromS3(deploymentId);
        // 🔍 DETECT PROJECT TYPE
        const projectType = detectProjectType(projectPath);
        console.log("🔎 Project type:", projectType);
        // 📦 INSTALL DEPENDENCIES
        // 📦 INSTALL DEPENDENCIES & BUILD (only for non-static)
        if (projectType !== "static") {
            installDependencies(projectPath);
            buildProject(projectPath, projectType);
        }
        // 📦 GET BUILD OUTPUT FOLDER
        const buildFolder = getBuildFolder(projectPath, projectType);
        if (!buildFolder || !fs_1.default.existsSync(buildFolder)) {
            throw new Error("❌ Build output folder not found");
        }
        console.log("📂 Build folder:", buildFolder);
        console.log("📄 Files in build folder:", fs_1.default.readdirSync(buildFolder));
        // ☁️ Upload build output to S3
        const deployPrefix = `deployments/${deploymentId}`;
        await uploadDirectoryToS3(buildFolder, deployPrefix);
        console.log("🚀 Build uploaded to S3");
        // 📊 Mark ready
        await updateDeploymentStatus(deploymentId, "ready");
        // 🔽 DELETE MESSAGE ONLY AFTER SUCCESS
        await sqs.deleteMessage({
            QueueUrl: process.env.SQS_QUEUE_URL,
            ReceiptHandle: message.ReceiptHandle,
        }).promise();
        console.log("✅ Message deleted");
    }
}
async function startWorker() {
    while (true) {
        try {
            await pollQueue();
        }
        catch (err) {
            console.error("Worker error:", err);
        }
    }
}
startWorker();
