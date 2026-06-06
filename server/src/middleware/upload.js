import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import config from '../config.js';

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.html';
    cb(null, `${uuid()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.uploadLimit },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/html' || path.extname(file.originalname).toLowerCase() === '.html') {
      cb(null, true);
    } else {
      cb(new Error('仅支持 HTML 文件'));
    }
  },
});
