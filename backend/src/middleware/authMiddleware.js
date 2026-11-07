const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    // รับ Token จาก Header (รูปแบบ: Bearer <token>)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบ' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // ใช้รหัสลับ 'secret123' ให้ตรงกับที่สร้างใน Auth/Admin Controller
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        
        // แยกเก็บข้อมูลตาม Role
        if (decoded.role === 'admin') {
            req.admin = decoded;
        } else if (decoded.role === 'student') {
            req.student = decoded;
        } else {
            req.merchant = decoded;
        }
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token ไม่ถูกต้อง หรือหมดอายุแล้ว' });
    }
};