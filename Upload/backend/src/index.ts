import express from "express";
import cors from "cors";
import generate from "./generator";
import simpleGit from "simple-git";
import path from "path";
import { getAllFiles } from "./files";
import dotenv from "dotenv";
import { uploadFile } from "./aws";
import {lPush} from './queue';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


// uploadFile("athrv/test", "/Users/HP/Agyat.io/backend/dist/outputC9d768ti/assets/img/about.jpg")
// user yaha pe github ki repo ka url send krega frontend se
app.post("/deploy", async (req, res) => {
    const url = req.body.repoUrl; // ye user ka github ka url hoga
    const id = generate();
    const git_path = path.join(__dirname, `output/${id}`);
    await simpleGit().clone(url, git_path); // git repo ko locally clone krlia
    // console.log(url);
    const files = getAllFiles(git_path);
    // console.log(files);
    files.forEach(async (file) => {
        // mere pas aisa path hoga for git repo files   /Users/HP/Agyat.io/backend/dist/output/C9d768ti/assets/img/about.jpg
        // ab s3 me shi se dhoondne ke lie i only need output/.......
        // to get that route slice the __dirname + 1 extra slash
        await uploadFile(file.slice(__dirname.length + 1).replace(/\\/g, '/'), file);
    });

    lPush(id);
    res.json({
        id: id,
    });
});

app.listen(process.env.PORT!, () => {
    console.log(`App listening on port ${process.env.PORT!}`);
});
