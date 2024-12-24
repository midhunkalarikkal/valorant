const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require("dotenv").config()

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDNAME,
    api_key: process.env.APIKEY,
    api_secret: process.env.APISECRET
});

// Set up Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "user_images", // Folder name in Cloudinary
        allowed_formats: ["jpg", "jpeg", "png"], // Allowed image formats
    },
});

module.exports = { cloudinary, storage };
