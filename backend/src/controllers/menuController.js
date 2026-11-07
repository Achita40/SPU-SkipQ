const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs'); // <--- เพิ่มบรรทัดนี้ สำหรับจัดการไฟล์
const path = require('path'); // <--- เพิ่มบรรทัดนี้ สำหรับจัดการที่อยู่ไฟล์

// 1. ดึงเมนูทั้งหมดของร้านค้า
exports.getMenus = async (req, res) => {
    try {
        const menus = await prisma.menu.findMany({
            where: { merchantId: req.merchant.id }
        });
        res.json(menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. เพิ่มเมนูใหม่ (รองรับการอัปโหลดไฟล์รูปภาพ)
exports.addMenu = async (req, res) => {
    try {
        const { name, price } = req.body;
        
        let imageUrl = null;
        if (req.file) {
            // สร้าง URL ให้ตรงกับพอร์ตของ Backend
            imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }

        const newMenu = await prisma.menu.create({
            data: {
                name,
                price: parseFloat(price),
                imageUrl: imageUrl, 
                merchantId: req.merchant.id
            }
        });
        res.status(201).json(newMenu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. ลบเมนู
exports.deleteMenu = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. เช็กก่อนว่ามีเมนูนี้ของร้านนี้จริงหรือไม่
        const menu = await prisma.menu.findFirst({
            where: { id: id, merchantId: req.merchant.id }
        });

        if (!menu) return res.status(404).json({ message: 'ไม่พบเมนู' });

        // 2. สั่งลบไฟล์รูปภาพออกจากโฟลเดอร์ uploads (ถ้ามีรูป)
        if (menu.imageUrl) {
            // ตัดเอาเฉพาะชื่อไฟล์ออกมาจาก URL (เช่น http://localhost:5000/uploads/123.jpg -> 123.jpg)
            const filename = menu.imageUrl.split('/').pop();
            // ชี้เป้าไปที่โฟลเดอร์ uploads
            const filePath = path.join(__dirname, '../../uploads', filename);
            
            // เช็กว่าไฟล์มีอยู่จริงไหม ถ้ามีให้ลบทิ้ง (unlink)
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // 3. ลบข้อมูลออกจาก Database
        await prisma.menu.delete({ where: { id: id } });
        res.json({ message: 'ลบเมนูและไฟล์รูปภาพสำเร็จ' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. แก้ไขเมนู
exports.updateMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price } = req.body;

        // เช็กก่อนว่ามีเมนูนี้อยู่จริง
        const existingMenu = await prisma.menu.findFirst({
            where: { id: id, merchantId: req.merchant.id }
        });

        if (!existingMenu) return res.status(404).json({ message: 'ไม่พบเมนู' });

        let imageUrl = existingMenu.imageUrl;

        // ถ้ามีการอัปโหลดรูปใหม่เข้ามา
        if (req.file) {
            imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
            
            // ลบรูปเก่าทิ้ง
            if (existingMenu.imageUrl) {
                const filename = existingMenu.imageUrl.split('/').pop();
                const filePath = path.join(__dirname, '../../uploads', filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // อัปเดตข้อมูลลงฐานข้อมูล
        const updatedMenu = await prisma.menu.update({
            where: { id: id },
            data: {
                name,
                price: parseFloat(price),
                imageUrl: imageUrl
            }
        });

        res.json(updatedMenu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. เปิด/ปิด การมองเห็นเมนู (ของหมด)
exports.toggleMenuStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await prisma.menu.findFirst({
            where: { id: id, merchantId: req.merchant.id }
        });

        if (!menu) return res.status(404).json({ message: 'ไม่พบเมนู' });

        // สลับค่า true เป็น false / false เป็น true
        const updatedMenu = await prisma.menu.update({
            where: { id: id },
            data: { isAvailable: !menu.isAvailable }
        });

        res.json(updatedMenu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};