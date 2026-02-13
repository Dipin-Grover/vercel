import fs from "fs";


import express from "express";
import cors from "cors";
import simpleGit from "simple-git";
import path from "path";
import dotenv from "dotenv";

const generate = require("./generator");
const { getAllFiles } = require("./files");
const { uploadFile } = require("./aws");
const { lPush } = require("./queue");





dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.post("/deploy", async (req, res) => {
  try {
    const url: string = req.body.repoUrl;

    if (!url) {
      return res.status(400).json({ error: "repoUrl is required" });
    }

    const id = generate();
    const outputBasePath = path.join(__dirname, "output");

if (!fs.existsSync(outputBasePath)) {
  fs.mkdirSync(outputBasePath, { recursive: true });
}

const git_path = path.join(outputBasePath, id);


    await simpleGit().clone(url, git_path);

    const files = getAllFiles(git_path);

    for (const file of files) {
      const s3Key = file
        .slice(__dirname.length + 1)
        .replace(/\\/g, "/");

      await uploadFile(s3Key, file);
    }

    lPush(id);

    res.json({ id });
  } catch (error) {
    console.error("Error in /deploy:", error);
    res.status(500).json({ error: "Deployment failed" });
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Upload service listening on port ${PORT}`);
});
