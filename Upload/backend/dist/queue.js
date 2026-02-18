"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sqs_1 = require("@aws-sdk/client-sqs");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sqs = new client_sqs_1.SQSClient({ region: process.env.AWS_REGION });
const dynamo = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION });
const queueUrl = process.env.AWS_SQS_QUEUE_URL;
const tableName = process.env.AWS_DYNAMO_DB_NAME;
async function lPush(id) {
    try {
        await sqs.send(new client_sqs_1.SendMessageCommand({
            QueueUrl: queueUrl,
            MessageBody: id,
        }));
        await dynamo.send(new client_dynamodb_1.PutItemCommand({
            TableName: tableName,
            Item: {
                id: { S: id },
                status: { S: "uploaded" },
            },
        }));
        console.log(`Successfully pushed ${id} to queue and set status to uploaded`);
    }
    catch (error) {
        console.error(`Error processing ${id}:`, error);
        throw error;
    }
}
module.exports = { lPush };
