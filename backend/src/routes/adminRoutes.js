const express = require('express');
const { adminLogin, getAllUsers, deleteUser } = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware'); // ใช้ป้องกัน API

const router = express.Router();

router.post('/login', adminLogin);

// API ด้านล่างนี้ต้องมี Token แอดมินแนบมาด้วย
router.get('/users', verifyToken, getAllUsers);
router.delete('/users/:type/:id', verifyToken, deleteUser);

module.exports = router;