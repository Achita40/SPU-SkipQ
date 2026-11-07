const express = require('express');

// นำเข้าฟังก์ชันทั้งหมดจาก authController (ทั้งของร้านค้าเดิม และของนักศึกษาที่เพิ่มใหม่)
const { 
    register, 
    login, 
    studentRegister, 
    studentLogin, 
    studentResetPassword 
} = require('../controllers/authController');

const router = express.Router();

// ---------------- ฝั่งร้านค้า (ของเดิม) ----------------
router.post('/register', register);
router.post('/login', login);

// ---------------- ฝั่งนักศึกษา (เพิ่มใหม่) ----------------
router.post('/student/register', studentRegister);
router.post('/student/login', studentLogin);
router.post('/student/reset-password', studentResetPassword);

module.exports = router;