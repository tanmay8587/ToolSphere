import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter(req, file, cb) {
        // MIME type is the primary validation check.
        const allowedMimeTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/svg+xml",
            "image/x-icon",
            "image/vnd.microsoft.icon",
        ];

        // A MIME type may map to multiple valid file extensions.
        const mimeToExtensions = {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/jpg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
            "image/svg+xml": [".svg"],
            "image/x-icon": [".ico"],
            "image/vnd.microsoft.icon": [".ico"],
        };

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Invalid file type. Only PNG, JPG, JPEG, WebP, SVG, and ICO images are allowed."));
        }

        // Extension is a secondary check: accept any valid extension for the MIME type.
        const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
        const expectedExtensions = mimeToExtensions[file.mimetype] || [];

        if (fileExtension && !expectedExtensions.includes(fileExtension)) {
            return cb(new Error(`File extension does not match MIME type. Expected one of ${expectedExtensions.join(", ")} for ${file.mimetype}.`));
        }

        cb(null, true);
    },
});

export default upload;