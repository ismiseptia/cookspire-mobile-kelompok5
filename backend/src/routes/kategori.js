const express = require('express');
const db = require('../config/db');
const { asyncHandler } = require('../utils');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT id_kategori, nama_kategori FROM kategori ORDER BY nama_kategori');
    res.json(rows);
  })
);

module.exports = router;
