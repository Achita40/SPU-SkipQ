const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. ดึงรายชื่อร้านค้าที่เปิดอยู่
exports.getMerchants = async (req, res) => {
    try {
        const merchants = await prisma.merchant.findMany({
            where: { isOpen: true },
            select: { id: true, name: true }
        });
        res.json(merchants);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 2. ดึงเมนูอาหารของร้านนั้นๆ
exports.getMerchantMenus = async (req, res) => {
    try {
        const menus = await prisma.menu.findMany({
            where: { merchantId: req.params.id, isAvailable: true }
        });
        res.json(menus);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 3. ดึงสถานะออเดอร์
exports.getOrderStatus = async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id }
        });
        if (!order) return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        res.json(order);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 4. สร้างออเดอร์ใหม่
exports.createOrder = async (req, res) => {
    try {
        const { merchantId, totalPrice, items, studentName } = req.body;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const orderCountToday = await prisma.order.count({
            where: { merchantId: merchantId, createdAt: { gte: today } }
        });

        // รันคิว Q001
        const queueNumber = `Q${String(orderCountToday + 1).padStart(3, '0')}`;

        // ดักตัวแปร Token ไว้ทั้งสองแบบ ป้องกัน Error undefined
        const currentStudentId = req.student ? req.student.id : (req.user ? req.user.id : null);

        const newOrder = await prisma.order.create({
            data: {
                queueNumber: queueNumber, 
                totalPrice: parseFloat(totalPrice),
                items: JSON.stringify(items), 
                merchantId: merchantId,
                studentName: studentName || 'ไม่ระบุชื่อ',
                studentId: currentStudentId 
            }
        });

        const io = req.app.get('io');
        if (io) { io.emit('new_order', newOrder); }

        res.status(201).json({ message: 'สั่งอาหารสำเร็จ', order: newOrder });
    } catch (error) {
        console.error("🚨 Create Order Error:", error); 
        res.status(500).json({ error: error.message });
    }
};

// 5. ดึงข้อมูลส่วนตัวของนักศึกษา
exports.getStudentProfile = async (req, res) => {
    try {
        const student = await prisma.student.findUnique({
            where: { id: req.student.id },
            select: { id: true, name: true, email: true, phone: true }
        });
        res.json(student);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 6. ดึงประวัติการสั่งอาหาร
exports.getOrderHistory = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { studentId: req.student.id },
            orderBy: { createdAt: 'desc' },
            include: { merchant: { select: { name: true } } }
        });
        res.json(orders);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// 7. สุ่มเมนูอาหาร (Menu Assistant)
exports.getRandomMenu = async (req, res) => {
    try {
        const availableMenus = await prisma.menu.findMany({
            where: {
                isAvailable: true,
                merchant: { isOpen: true }
            },
            include: {
                merchant: { select: { id: true, name: true } } 
            }
        });

        if (availableMenus.length === 0) {
            return res.status(404).json({ message: 'ไม่มีเมนูพร้อมขายในขณะนี้' });
        }

        const randomIndex = Math.floor(Math.random() * availableMenus.length);
        const randomMenu = availableMenus[randomIndex];

        res.json(randomMenu);
    } catch (error) {
        console.error("Random Menu Error:", error);
        res.status(500).json({ error: error.message });
    }
};