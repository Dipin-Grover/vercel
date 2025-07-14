import express from "express";
import { S3 } from "aws-sdk";
import dotenv from 'dotenv'
dotenv.config();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!
})
const app = express();

app.get("/*", async (req, res) => {
    const host = req.hostname;
    console.log(host);
    const id = host.split(".")[0];
    console.log(id);
    const filePath = req.path;
    console.log(filePath);

    const contents = await s3.getObject({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: `dist/${id}${filePath}`
    }).promise();
    
    const type = filePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript"
    res.set("Content-Type", type);

    res.send(contents.Body);
})

app.listen(3001); 