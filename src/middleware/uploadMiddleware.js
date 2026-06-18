const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const maxFileSize = 5 * 1024 * 1024; // 5MB

// Cloudinary storage for documents
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `gramsaathi/documents/${req.user?.id || 'unknown'}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
    resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
  }),
});

// Cloudinary storage for crop images
const cropImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'gramsaathi/crop-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
  },
});

// Cloudinary storage for profile photos
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'gramsaathi/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.'), false);
  }
};

const uploadDocument = multer({ storage: documentStorage, fileFilter, limits: { fileSize: maxFileSize } });
const uploadCropImage = multer({ storage: cropImageStorage, fileFilter, limits: { fileSize: maxFileSize } });
const uploadProfilePhoto = multer({ storage: profilePhotoStorage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = { uploadDocument, uploadCropImage, uploadProfilePhoto };