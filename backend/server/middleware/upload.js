import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter(req, file, cb) {
        const allowedMimeTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
        ];

        const mimeToExtension = {
            "image/png": ".png",
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/webp": ".webp",
        };

        if (file.mimetype === "image/svg+xml") {
            return cb(new Error("SVG files are not allowed for security reasons."));
        }

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Invalid file type. Only PNG, JPEG, JPG, and WebP images are allowed."));
        }

        const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
        const expectedExtension = mimeToExtension[file.mimetype];

        if (fileExtension !== expectedExtension) {
            return cb(new Error(`File extension does not match MIME type. Expected ${expectedExtension} for ${file.mimetype}.`));
        }

        cb(null, true);
    },
});

export default upload;