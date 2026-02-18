"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const simple_git_1 = __importDefault(require("simple-git"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const generate = require("./generator");
const { getAllFiles } = require("./files");
const { uploadFile } = require("./aws");
const { lPush } = require("./queue");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/deploy", async (req, res) => {
    try {
        const url = req.body.repoUrl;
        if (!url) {
            return res.status(400).json({ error: "repoUrl is required" });
        }
        const id = generate();
        const outputBasePath = path_1.default.join(__dirname, "output");
        if (!fs_1.default.existsSync(outputBasePath)) {
            fs_1.default.mkdirSync(outputBasePath, { recursive: true });
        }
        const git_path = path_1.default.join(outputBasePath, id);
        await (0, simple_git_1.default)().clone(url, git_path);
        const files = getAllFiles(git_path);
        for (const file of files) {
            const s3Key = file
                .slice(__dirname.length + 1)
                .replace(/\\/g, "/");
            await uploadFile(s3Key, file);
        }
        lPush(id);
        res.json({ id });
    }
    catch (error) {
        console.error("Error in /deploy:", error);
        res.status(500).json({ error: "Deployment failed" });
    }
});
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Upload service listening on port ${PORT}`);
});
