import fs from "fs";
import path from "path";
import multer from "multer";

const uploadDir = path.resolve("uploads/imports");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, uploadDir);
    },
    filename(req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
        cb(null, uniqueName);
    }
});

const allowedMimeTypes = [
    "text/csv",
    "application/json",
    "application/vnd.ms-excel",
    "text/plain"
];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".csv" || ext === ".json" || ext === ".txt") {
        return cb(null, true);
    }
    return cb(new Error("Unsupported file type. Only CSV and JSON files are allowed."), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

export default upload;
