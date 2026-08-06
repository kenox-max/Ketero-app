const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup multer memory storage for receipt parsing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Upload helper: uploads to Cloudinary or falls back to local uploads folder
const uploadImageBuffer = (fileBuffer, originalName = 'receipt.jpg', folder = 'receipts') => {
  return new Promise((resolve, reject) => {
    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (hasCloudinary) {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `ketero/${folder}` },
        (error, result) => {
          if (error) {
            console.error('[CLOUDINARY UPLOAD ERROR]:', error);
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        }
      );
      stream.end(fileBuffer);
    } else {
      // Local Disk Storage Fallback
      try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const ext = path.extname(originalName) || '.jpg';
        const filename = `${folder}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, fileBuffer);
        const localUrl = `/uploads/${filename}`;
        console.log(`[LOCAL STORAGE FALLBACK] Saved image to ${localUrl}`);
        resolve(localUrl);
      } catch (err) {
        console.error('[LOCAL STORAGE ERROR]:', err);
        reject(err);
      }
    }
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadImageBuffer,
};
