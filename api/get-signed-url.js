import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: 'veezopro',
    credentials: JSON.parse(process.env.SERVICE_ACCOUNT_KEY),
});

// Function to generate a signed URL
export default async function GetSignedUrl(req, res) {
    const { bucketName, fileName } = req.body;

    // Validate bucket name and file name in the request
    if (!bucketName || !fileName) {
        return res.status(400).json({ error: 'Missing bucketName or fileName in request' });
    }

    // Set the signed URL options for uploading
    const options = {
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    try {
        // Generate the signed URL with the bucket and generated filename
        const [url] = await storage
            .bucket(bucketName)
            .file(fileName)
            .getSignedUrl(options);

        // Return the signed URL
        res.status(200).json({ url });
    } catch (error) {
        console.error('Error generating signed URL:', error.message);
        res.status(500).json({ error: `Could not generate signed URL: ${error.message}` });
    }
}

// Function to set CORS configuration
export const SetCors = async () => {
    const storage = new Storage({
        projectId: 'veezopro',
        credentials: JSON.parse(process.env.SERVICE_ACCOUNT_KEY),
    });

    // Set CORS configuration to allow cross-origin requests
    await storage.bucket('vzpro').setCorsConfiguration([
        {
            maxAgeSeconds: 3600,
            method: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
            origin: ["https://veezo.pro"],
            responseHeader: ["Content-Type", "Authorization"]
        },
    ]);
}
