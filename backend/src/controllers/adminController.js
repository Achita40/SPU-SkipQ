const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. ล็อกอินแอดมิน (ใช้บัญชีเดียว สมมติเป็น admin / admin123)
exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        // ระบบแอดมินมักจะใช้วิธี Hardcode บัญชีแรก หรือสร้างผ่าน Script 
        // เพื่อความรวดเร็วในการพรีเซนต์ เราจะดักรหัสตรงนี้เลย
        if (username === 'admin' && password === 'admin123') {
            const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
            return res.json({ token, message: 'เข้าสู่ระบบผู้ดูแลระบบสำเร็จ' });
        }
        res.status(401).json({ message: 'ข้อมูลแอดมินไม่ถูกต้อง' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 2. ดึงข้อมูล User ทั้งหมด
exports.getAllUsers = async (req, res) => {
    try {
        // ดึงข้อมูลทั้งหมดโดยไม่ฟิกซ์ชื่อคอลัมน์ (ป้องกัน Error 500 เวลาฐานข้อมูลเปลี่ยน)
        const students = await prisma.student.findMany();
        const merchants = await prisma.merchant.findMany();

        // กรองรหัสผ่านทิ้งก่อนส่งไปหน้าจอแอดมิน เพื่อความปลอดภัย
        const safeStudents = students.map(s => { const { password, ...rest } = s; return rest; });
        const safeMerchants = merchants.map(m => { const { password, ...rest } = m; return rest; });

        res.json({ students: safeStudents, merchants: safeMerchants });
    } catch (error) { 
        console.error("Admin Users Error:", error); // ปริ้นท์บอกสาเหตุที่แท้จริงใน Terminal
        res.status(500).json({ error: error.message }); 
    }
};

// 3. ลบผู้ใช้งาน (เตะออกจากระบบ)
exports.deleteUser = async (req, res) => {
    const { type, id } = req.params; // type = 'student' หรือ 'merchant'
    try {
        if (type === 'student') {
            await prisma.student.delete({ where: { id } });
        } else if (type === 'merchant') {
            // ต้องลบเมนูและออเดอร์ของร้านนี้ก่อน ถึงจะลบร้านได้
            await prisma.menu.deleteMany({ where: { merchantId: id } });
            await prisma.order.deleteMany({ where: { merchantId: id } });
            await prisma.merchant.delete({ where: { id } });
        }
        res.json({ message: `ลบ ${type} สำเร็จ` });
    } catch (error) { res.status(500).json({ error: error.message }); }
};