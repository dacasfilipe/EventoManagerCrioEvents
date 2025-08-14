import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// For Vercel, we'll use memory storage and then upload to a cloud service
// In production, you should use a cloud storage service like AWS S3, Cloudinary, etc.
export const createUploadConfig = () => {
  // In development, use disk storage
  if (process.env.NODE_ENV !== 'production') {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const diskStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = uuidv4();
        const fileExt = path.extname(file.originalname);
        cb(null, uniqueSuffix + fileExt);
      }
    });

    return {
      storage: diskStorage,
      fileFilter: fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    };
  }
  
  // In production (Vercel), use memory storage
  // You should integrate with a cloud storage service here
  return {
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  };
};

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado. Apenas JPEG, PNG, GIF e WEBP são aceitos."));
  }
};