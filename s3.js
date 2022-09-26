const AWS = require("aws-sdk");
const fs = require("fs-extra");
const path = require("path");

const bucket = process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const region = process.env.AWS_BUCKET_REGION;

AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});

const s3Bucket = new AWS.S3({
  params: {
    Bucket: bucket,
  },
});

module.exports = { uploadFile };

async function uploadFile(filePath) {
  const image = fs.readFileSync(filePath);

  const newdata = {
    Key: path.basename(filePath),
    Body: image,
    ContentType: image.mimetype,
  };
  const upload = await s3Bucket.upload(newdata);
  const promise = await upload.promise();
  return promise.Location;
}

async function deleteFile(Key) {
  try {
    await s3Bucket.headObject({ Key }).promise();
    try {
      await s3Bucket.deleteObject({ Key }).promise();
    } catch (err) {
      throw "ERROR in file Deleting : " + JSON.stringify(err)
    }
  } catch (err) {
    throw "File not Found ERROR : " + err.code;
  }
}
