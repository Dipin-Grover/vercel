"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const downloadFromS3_1 = require("./downloadFromS3");
const app = (0, express_1.default)();
const PORT = 9000;
app.use("/:deploymentId", async (req, res, next) => {
    const deploymentId = req.params.deploymentId;
    // Ignore requests like favicon.ico
    if (deploymentId.includes(".")) {
        return res.status(404).send("Not found");
    }
    const deploymentPath = path_1.default.join(process.cwd(), "../workspace/deployments", deploymentId);
    console.log("Request for:", deploymentId);
    console.log("Serving from:", deploymentPath);
    if (!fs_1.default.existsSync(deploymentPath)) {
        console.log("Folder not found locally. Downloading from S3...");
        const downloaded = await (0, downloadFromS3_1.downloadDeployment)(deploymentId);
        if (!downloaded) {
            return res.status(404).send("Deployment not found");
        }
    }
    const staticMiddleware = express_1.default.static(deploymentPath);
    staticMiddleware(req, res, (err) => {
        if (err)
            return next(err);
        // fallback to index.html
        const indexFile = path_1.default.join(deploymentPath, "index.html");
        if (fs_1.default.existsSync(indexFile)) {
            res.sendFile(indexFile);
        }
        else {
            res.status(404).send("Deployment not found");
        }
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Deployment server running on http://localhost:${PORT}`);
});
