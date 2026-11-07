const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');

// นำเข้าฟังก์ชันทั้งหมดที่ร้านค้าต้องใช้จาก Controller
const { 
    getMerchantProfile,
    toggleStoreStatus, 
    getMerchantOrders,
    updateOrderStatus,
    getDailySummary 
} = require('../controllers/merchantController');

const router = express.Router();

// 1. ดึงข้อมูลโปรไฟล์ร้านค้า (สำหรับแสดงชื่อร้านและสถานะเปิด/ปิดมุมขวาบน)
router.get('/me', verifyToken, getMerchantProfile);

// 2. เปิด-ปิดร้านตัวเอง
router.put('/status', verifyToken, toggleStoreStatus);

// 3. ดึงรายการออเดอร์ทั้งหมดของร้านนี้มาแสดงที่ Dashboard
router.get('/orders', verifyToken, getMerchantOrders);

// 4. อัปเดตสถานะออเดอร์ (เช่น กดรับออเดอร์ -> กำลังทำ -> พร้อมเสิร์ฟ)
router.put('/orders/:id', verifyToken, updateOrderStatus);

// 5. ดึงข้อมูลสรุปยอดขายประจำวัน
router.get('/summary', verifyToken, getDailySummary);

module.exports = router;