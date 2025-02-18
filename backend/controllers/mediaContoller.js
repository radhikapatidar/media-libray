const { uploadToMinIO, getFromMinIO,deleteFromMinIO  } = require("../services/minioService");
const { saveToDynamoDB, fetchMediaList, fetchMediaMetadata,deleteFromDynamoDB  } = require("../services/dynamoDBService");
const { v4: uuidv4 } = require("uuid");

async function uploadMedia(req, res) {
  try {
    const file = req.file;
    const metadata = JSON.parse(req.body.metadata);

    if (!file || !metadata) {
      return res.status(400).json({ error: "File and metadata are required." });
    }

    const mediaId = uuidv4();
    const etag = await uploadToMinIO(mediaId, file.buffer);
    await saveToDynamoDB(mediaId, metadata, etag, file.size);

    res.status(200).json({ message: "File uploaded successfully!", mediaId });
  } catch (error) {
    console.error("Error uploading media:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function listMedia(req, res) {
  try {
    const mediaList = await fetchMediaList();  // This function should return an array of media items
    const updatedMediaList = mediaList.map(media => {
      return {
        mediaId: media.mediaId,
        metadata: media.metadata,
        imageUrl: `http://localhost:5000/api/media/${media.mediaId}` // Dynamically generate image URL
      };
    });

    res.status(200).json({ media: updatedMediaList });  // Return the updated media list
  } catch (error) {
    console.error("Error fetching media list:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function getMedia(req, res) {
  try {
    const { id } = req.params;
    const metadata = await fetchMediaMetadata(id);

    if (!metadata) {
      return res.status(404).json({ error: "Media not found." });
    }

    const stream = await getFromMinIO(id);
    res.setHeader("Content-Type", "image/jpeg");  // Adjust based on media type
    stream.pipe(res);
  } catch (error) {
    console.error("Error retrieving media:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}

async function deleteMedia(req, res) {
  try {
    const { id } = req.params;
    const metadata = await fetchMediaMetadata(id);
    if (!metadata) return res.status(404).json({ error: "Media not found." });

    await deleteFromMinIO(id);
    await deleteFromDynamoDB(id);

    res.status(200).json({ message: "File deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
}


module.exports = { uploadMedia, listMedia, getMedia,deleteMedia };