const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // <--- ถ้าลืมบรรทัดนี้ App จะ Crash ทันที
const { getMenus, addMenu, deleteMenu, updateMenu, toggleMenuStatus } = require('../controllers/menuController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// 1. สร้างโฟลเดอร์ uploads อัตโนมัติถ้ายังไม่มี
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. ตั้งค่า Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 3. ใช้งาน Routes 
router.get('/', verifyToken, getMenus);
router.post('/', verifyToken, upload.single('image'), addMenu); // <--- ต้องมี upload.single('image')
router.put('/:id', verifyToken, upload.single('image'), updateMenu); // <--- เพิ่ม Route สำหรับอัปเดตเมนู
router.delete('/:id', verifyToken, deleteMenu); 
router.put('/:id/toggle', verifyToken, toggleMenuStatus);

module.exports = router;