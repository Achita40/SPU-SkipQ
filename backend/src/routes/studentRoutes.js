const express = require('express');

// นำเข้า Middleware สำหรับตรวจสอบ Token
const { verifyToken } = require('../middleware/authMiddleware');

// นำเข้าฟังก์ชันทั้งหมดจาก Controller
const { 
    getMerchants, 
    getMerchantMenus, 
    createOrder, 
    getOrderStatus,
    getStudentProfile,
    getOrderHistory,
    getRandomMenu
} = require('../controllers/studentController');

const router = express.Router();

// --- API ที่ไม่ต้องใช้ Token ---
router.get('/merchants', getMerchants);
router.get('/merchants/:id/menus', getMerchantMenus);
router.get('/orders/:id', getOrderStatus);
router.get('/random-menu', getRandomMenu); // <--- ระบบสุ่มเมนู

// --- API ที่ต้องใช้ Token ---
router.post('/orders', verifyToken, createOrder); 
router.get('/me', verifyToken, getStudentProfile);
router.get('/my-orders', verifyToken, getOrderHistory);

module.exports = router;