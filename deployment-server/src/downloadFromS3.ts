import fs from "fs";
import path from "path";
import { s3 } from "./aws";

export const downloadDeployment = async (deploymentId: string): Promise<boolean> => {
  const bucket = process.env.AWS_BUCKET_NAME!;
  const prefix = `output/${deploymentId}/`;

  const list = await s3
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
    if (!file.Key) continue;

    const data = await s3
      .getObject({
        Bucket: bucket,
        Key: file.Key,
      })
      .promise();

    const relativePath = file.Key.replace(prefix, "");

    const localPath = path.join(
      __dirname,
      "../../workspace/deployments",
      deploymentId,
      relativePath
    );

    fs.mkdirSync(path.dirname(localPath), { recursive: true });

    fs.writeFileSync(localPath, data.Body as Buffer);

    console.log("Downloaded:", relativePath);
  }

  console.log("Deployment downloaded successfully");
  return true;
};
