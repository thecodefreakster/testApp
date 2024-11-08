const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

// Create a storage client using the service account credentials
const storage = new Storage({
    credentials: serviceAccount,
});

// Replace with your bucket name
const bucketName = 'vzpro';

// Set up multer to use memory storage
const upload = multer(
    { storage: multer.memoryStorage()
    });

export default function handler(req, res) {
    if (req.method === 'POST') {
        upload.single('file')(req, res, async function (err) {
            if (err) return res.status(500).json({ error: err.message });

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            try {
                // Generate a unique filename
                const fileId = generateRandomId();
                const fileExtension = path.extname(req.file.originalname);
                const filename = `${fileId}${fileExtension}`;
                console.log('uploading---');

                // Upload file to Google Cloud Storage
                const bucketFile = storage.bucket(bucketName).file(filename);
                const stream = bucketFile.createWriteStream({
                    metadata: {
                        contentType: req.file.mimetype, // Set the correct content type
                    },
                });

                // Pipe the file stream to the bucket
                stream.on('error', (uploadErr) => {
                    console.error('Error uploading file:', uploadErr);
                    res.status(500).send('Error uploading file');
                });

                stream.on('finish', () => {
                    console.log('File uploaded successfully');
                    const fileUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
                    res.status(200).json({ id: fileId, url: fileUrl });
                });

                // Pipe the uploaded file buffer (or stream) to the GCS stream
                stream.end(req.file.buffer);
            } catch (error) {
                console.error('Upload error:', error);
                res.status(500).send('Error uploading file');
            }
        });
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}

function generateRandomId() {
    return Math.random().toString(36).substring(2, 8);
}