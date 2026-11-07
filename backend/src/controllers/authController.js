const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'spu_skipq_secret_key'; // คีย์เข้ารหัส


// ฟังก์ชันสมัครร้านค้า
exports.register = async (req, res) => {
    try {
        const { name, username, password, email, phone } = req.body; 

        const existingMerchant = await prisma.merchant.findUnique({ where: { username } });
        if (existingMerchant) return res.status(400).json({ message: 'Username นี้ถูกใช้งานแล้ว' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.merchant.create({
            data: { 
                name, 
                username, 
                password: hashedPassword, 
                email: email || null, 
                phone: phone || null 
            }
        });

        res.status(201).json({ message: 'สร้างร้านค้าสำเร็จ' });
    } catch (error) { 
        console.error("Merchant Register Error:", error); // ให้ปริ้นท์สาเหตุที่แท้จริงออกมา
        res.status(500).json({ error: error.message }); 
    }
};

// ฟังก์ชันเข้าสู่ระบบ (ร้านค้า)
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. ค้นหาบัญชีร้านค้าในฐานข้อมูล
        const merchant = await prisma.merchant.findUnique({ where: { username } });
        
        // 2. ถ้าไม่พบร้านค้านี้ ให้แจ้งเตือน (ไม่ใช่ 500 แต่เป็น 401 Unauthorized)
        if (!merchant) {
            return res.status(401).json({ message: 'ไม่พบบัญชีผู้ใช้งานนี้ (คุณสมัครสมาชิกหรือยัง?)' });
        }

        // 3. ตรวจสอบรหัสผ่าน
        const isValidPassword = await bcrypt.compare(password, merchant.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // 4. สร้าง Token ส่งกลับไปให้หน้าเว็บ
        const token = jwt.sign(
            { id: merchant.id, role: 'merchant' }, 
            process.env.JWT_SECRET || 'secret123', 
            { expiresIn: '1d' }
        );

        res.json({ token, merchant: { id: merchant.id, name: merchant.name, username: merchant.username } });
    } catch (error) {
        console.error("Merchant Login Error:", error); // ปริ้นท์บอกใน Terminal ถ้าระบบพัง
        res.status(500).json({ error: error.message });
    }
};

/// ฟังก์ชันสมัครนักศึกษา
exports.studentRegister = async (req, res) => {
    try {
        // 1. รับค่า phone เพิ่มเข้ามาจาก req.body
        const { name, email, password, phone } = req.body; 

        if (!email.endsWith('@spumail.net')) {
            return res.status(400).json({ message: 'กรุณาใช้อีเมล @spumail.net ของมหาวิทยาลัยเท่านั้น' });
        }

        const existingStudent = await prisma.student.findUnique({ where: { email } });
        if (existingStudent) return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 2. บันทึก phone ลงในฐานข้อมูล
        await prisma.student.create({
            data: { 
                name, 
                email, 
                password: hashedPassword, 
                phone: phone || null 
            }
        });

        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
    } catch (error) { 
        console.error("Student Register Error:", error);
        res.status(500).json({ error: error.message }); 
    }
};

// 2. ล็อกอินนักศึกษา
exports.studentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email.endsWith('@spumail.net')) {
            return res.status(400).json({ message: 'กรุณาใช้อีเมล @spumail.net ของมหาวิทยาลัยเท่านั้น' });
        }

        const student = await prisma.student.findUnique({ where: { email } });
        if (!student) return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้นี้' });

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

        const token = jwt.sign({ id: student.id, role: 'student' }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });
        res.json({ token, student: { id: student.id, name: student.name, email: student.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. ลืมรหัสผ่าน (รีเซ็ตเป็นค่าเริ่มต้น spu123456 เพื่อใช้พรีเซนต์โปรเจกต์)
exports.studentResetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email.endsWith('@spumail.net')) return res.status(400).json({ message: 'ต้องเป็นอีเมล @spumail.net' });

        const student = await prisma.student.findUnique({ where: { email } });
        if (!student) return res.status(404).json({ message: 'ไม่พบอีเมลนี้ในระบบ' });

        // รีเซ็ตรหัสผ่านเป็น spu123456
        const newPassword = await bcrypt.hash('spu123456', 10);
        await prisma.student.update({
            where: { email },
            data: { password: newPassword }
        });

        res.json({ message: 'รีเซ็ตรหัสผ่านเป็น spu123456 เรียบร้อยแล้ว กรุณาล็อกอินใหม่' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};