const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. ดึงข้อมูลโปรไฟล์ร้านค้า (แสดงชื่อและสถานะมุมขวาบน)
exports.getMerchantProfile = async (req, res) => {
    try {
        const merchant = await prisma.merchant.findUnique({
            where: { id: req.merchant.id },
            select: { id: true, name: true, username: true, isOpen: true } // ไม่ดึงรหัสผ่านออกมา
        });
        if (!merchant) return res.status(404).json({ message: 'ไม่พบข้อมูลร้านค้า' });
        res.json(merchant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. เปิด-ปิด สถานะการรับออเดอร์ของร้านค้า
exports.toggleStoreStatus = async (req, res) => {
    try {
        const merchant = await prisma.merchant.findUnique({ where: { id: req.merchant.id } });
        if (!merchant) return res.status(404).json({ message: 'ไม่พบร้านค้า' });

        const updatedMerchant = await prisma.merchant.update({
            where: { id: req.merchant.id },
            data: { isOpen: !merchant.isOpen }
        });
        res.json(updatedMerchant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. ดึงรายการออเดอร์ทั้งหมดของร้านค้า
exports.getMerchantOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { merchantId: req.merchant.id },
            orderBy: { createdAt: 'desc' } // เรียงออเดอร์ใหม่ล่าสุดขึ้นก่อน
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. อัปเดตสถานะออเดอร์ (รอรับ -> กำลังทำ -> เสร็จ)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await prisma.order.update({
            where: { id: id, merchantId: req.merchant.id }, // เช็กให้ชัวร์ว่าเป็นออเดอร์ของร้านนี้จริงๆ
            data: { status: status }
        });

        // ส่งสัญญาณแจ้งเตือนกลับไปที่หน้าจอนักศึกษาแบบ Real-time
        const io = req.app.get('io');
        if (io) {
            io.emit('order_status_changed', updatedOrder);
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. สรุปยอดขายประจำวัน
exports.getDailySummary = async (req, res) => {
    try {
        // ตั้งเวลาเริ่มต้นของวันนี้ (เที่ยงคืน)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ดึงเฉพาะออเดอร์ของร้านนี้ ที่ทำ "เสร็จแล้ว" และสั่ง "วันนี้"
        const completedOrders = await prisma.order.findMany({
            where: {
                merchantId: req.merchant.id,
                status: 'Completed',
                createdAt: { gte: today }
            },
            orderBy: { createdAt: 'desc' } 
        });

        // คำนวณยอดเงินรวม
        const totalSales = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);
        const totalOrders = completedOrders.length;

        res.json({ totalSales, totalOrders, orders: completedOrders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};