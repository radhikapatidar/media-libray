const { DynamoDBClient, ScanCommand, PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
require("dotenv").config();

const dynamoDB = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT,
  credentials: {
    accessKeyId: "test1",
    secretAccessKey: "test1",
  },
});

async function saveToDynamoDB(mediaId, metadata, etag, fileSize) {
    const item = {
      TableName: "media",
      Item: marshall({
        mediaId,
        metadata: JSON.stringify(metadata),  // Ensure metadata is properly stringified
        etag,
        fileSize,
        uploadDate: new Date().toISOString(),
      }),
    };
    await dynamoDB.send(new PutItemCommand(item));  // Save metadata to DynamoDB
  }
async function fetchMediaList() {
    const command = new ScanCommand({ TableName: "media" });
    const result = await dynamoDB.send(command);
  
    // Ensure correct unmarshalling
    return result.Items.map(item => unmarshall(item));
  }
  
  async function fetchMediaMetadata(mediaId) {
    const command = new GetItemCommand({
      TableName: "media",
      Key: marshall({ mediaId }),
    });
    const result = await dynamoDB.send(command);
    return result.Item ? unmarshall(result.Item) : null;
  }
  

module.exports = { saveToDynamoDB, fetchMediaList, fetchMediaMetadata };