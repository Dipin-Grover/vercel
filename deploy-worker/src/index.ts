const IGNORE_FOLDERS = ["node_modules", ".git", ".next", ".cache"];


import AWS from "aws-sdk";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// 🔹 Load env FIRST
dotenv.config({ path: "./.env" });

// 🔹 Configure AWS FIRST
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

// 🔹 Create clients AFTER config
const sqs = new AWS.SQS();
const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();


// ===============================
// S3 DOWNLOAD LOGIC
// ===============================
async function downloadFromS3(deploymentId: string) {
  const baseDir = path.join("workspace", "source", deploymentId);
  fs.mkdirSync(baseDir, { recursive: true });

  const objects = await s3.listObjectsV2({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Prefix: `output/${deploymentId}/`,
  }).promise();

  if (!objects.Contents || objects.Contents.length === 0) {
    console.log("❌ No files found in S3");
    return;
  }

  

  for (const obj of objects.Contents) {
    if (!obj.Key || obj.Key.endsWith("/")) continue;

    const relativePath = obj.Key.replace(`output/${deploymentId}/`, "");
    const filePath = path.join(baseDir, relativePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const file = await s3.getObject({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: obj.Key,
    }).promise();

    fs.writeFileSync(filePath, file.Body as Buffer);
  }

  console.log(`✅ Source downloaded for ${deploymentId}`);
}

function detectProjectType(projectPath: string) {
  if (fs.existsSync(path.join(projectPath, "package.json"))) {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(projectPath, "package.json"), "utf-8")
    );

    if (pkg.dependencies?.next) return "nextjs";
    if (pkg.dependencies?.react) return "react";
    return "node";
  }

  return "static";
}

// ===============================
// DEPENDENCY INSTALL
// ===============================
function installDependencies(projectPath: string) {
  console.log("📦 Installing dependencies...");

  execSync("npm install", {
    cwd: projectPath,
    stdio: "inherit",
  });

  console.log("✅ Dependencies installed");
}







// ===============================
// BUILD PROJECT
// ===============================
function buildProject(projectPath: string, projectType: string) {
  console.log("🏗️ Building project...");

  if (projectType === "nextjs") {
    execSync("npm run build", {
      cwd: projectPath,
      stdio: "inherit",
    });
  }

  if (projectType === "react") {
    execSync("npm run build", {
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



function getBuildFolder(projectPath: string, projectType: string) {
  if (projectType === "react") {
    return path.join(projectPath, "build");
  }

  if (projectType === "static") {
    return projectPath;
  }

  if (projectType === "node") {
    return projectPath; // 👈 THIS IS THE FIX
  }

  return null;
}




async function uploadDirectoryToS3(
  localDir: string,
  s3Prefix: string
) {
  const entries = fs.readdirSync(localDir);

  for (const entry of entries) {

    // 🔹 Skip heavy folders
    if (IGNORE_FOLDERS.includes(entry)) {
      console.log("⏭️ Skipping:", entry);
      continue;
    }

    const fullPath = path.join(localDir, entry);
    const s3Key = `${s3Prefix}/${entry}`;

    if (fs.statSync(fullPath).isDirectory()) {
      await uploadDirectoryToS3(fullPath, s3Key);
    } else {
      const fileBuffer = fs.readFileSync(fullPath);

      await s3.putObject({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: getContentType(entry),
      }).promise();

      console.log("☁️ Uploaded:", s3Key);
    }
  }
}



function getContentType(fileName: string) {
  if (fileName.endsWith(".html")) return "text/html";
  if (fileName.endsWith(".css")) return "text/css";
  if (fileName.endsWith(".js")) return "application/javascript";
  if (fileName.endsWith(".json")) return "application/json";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg")) return "image/jpeg";
  if (fileName.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

async function updateDeploymentStatus(deploymentId: string, status: string) {
  await dynamoDb.update({
    TableName: process.env.DYNAMODB_TABLE_NAME!,
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
    QueueUrl: process.env.SQS_QUEUE_URL!,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10,
  };

  const data = await sqs.receiveMessage(params).promise();

  if (!data.Messages || data.Messages.length === 0) {
    console.log("⏳ No messages");
    return;
  }

  for (const message of data.Messages) {
    const deploymentId = message.Body!;
    console.log("📦 Received deployment:", deploymentId);
    await updateDeploymentStatus(deploymentId, "building");


    const projectPath = path.join("workspace", "source", deploymentId);

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

if (!buildFolder || !fs.existsSync(buildFolder)) {
  throw new Error("❌ Build output folder not found");
}

console.log("📂 Build folder:", buildFolder);
console.log("📄 Files in build folder:", fs.readdirSync(buildFolder));

// ☁️ Upload build output to S3
const deployPrefix = `deployments/${deploymentId}`;

await uploadDirectoryToS3(buildFolder, deployPrefix);

console.log("🚀 Build uploaded to S3");

// 📊 Mark ready
await updateDeploymentStatus(deploymentId, "ready");


    // 🔽 DELETE MESSAGE ONLY AFTER SUCCESS
    await sqs.deleteMessage({
      QueueUrl: process.env.SQS_QUEUE_URL!,
      ReceiptHandle: message.ReceiptHandle!,
    }).promise();

    console.log("✅ Message deleted");
  }
}


async function startWorker() {
  while (true) {
    try {
      await pollQueue();
    } catch (err) {
  console.error("Worker error:", err);
}
  }
}

startWorker();

