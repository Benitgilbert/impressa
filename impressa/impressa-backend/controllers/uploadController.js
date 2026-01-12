export const uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded"
        });
    }

    // Return the URL path
    // Multer Cloudinary Storage provides the full URL in req.file.path
    const fileUrl = req.file.path;

    res.json({
        success: true,
        message: "Image uploaded successfully",
        data: {
            url: fileUrl,
            filename: req.file.filename
        }
    });
};
