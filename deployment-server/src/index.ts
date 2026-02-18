
import express from "express";
import path from "path";
import fs from "fs";
import { downloadDeployment } from "./downloadFromS3";

const app = express();
const PORT = 9000;

app.use("/:deploymentId", async (req, res, next) => {
  const deploymentId = req.params.deploymentId;

  // Ignore requests like favicon.ico
  if (deploymentId.includes(".")) {
    return res.status(404).send("Not found");
  }

  const deploymentPath = path.join(
    process.cwd(),
    "../workspace/deployments",
    deploymentId
  );

  console.log("Request for:", deploymentId);
  console.log("Serving from:", deploymentPath);

  if (!fs.existsSync(deploymentPath)) {
    console.log("Folder not found locally. Downloading from S3...");

    const downloaded = await downloadDeployment(deploymentId);

    if (!downloaded) {
      return res.status(404).send("Deployment not found");
    }
  }

  const staticMiddleware = express.static(deploymentPath);

  staticMiddleware(req, res, (err) => {
    if (err) return next(err);

    // fallback to index.html
    const indexFile = path.join(deploymentPath, "index.html");

    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send("Deployment not found");
    }
  });
});



app.listen(PORT, () => {
  console.log(`🚀 Deployment server running on http://localhost:${PORT}`);
});
