const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.post('/', authenticate, (req, res) => {
  try {
    const { image, prefix = 'img' } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, message: 'Data gambar tidak valid.' });
    }

    const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    const ext = matches ? (matches[1] === 'jpeg' ? 'jpg' : matches[1]) : 'jpg';
    const base64Data = matches ? matches[2] : image;

    const safePrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, '') || 'img';
    const fileName = `${safePrefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    return res.status(201).json({
      success: true,
      url: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error('Error Upload Image:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal mengunggah gambar.' });
  }
});

module.exports = router;