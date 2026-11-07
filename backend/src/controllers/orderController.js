const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ดึงออเดอร์ทั้งหมดของร้านค้านี้
exports.getOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            where: { merchantId: req.merchant.id },
            orderBy: { createdAt: 'asc' } // เรียงจากคิวเก่าสุดไปคิวใหม่
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// อัปเดตสถานะออเดอร์
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // เช็กว่าเป็นออเดอร์ของร้านนี้จริงไหม
        const existingOrder = await prisma.order.findFirst({
            where: { id: id, merchantId: req.merchant.id }
        });

        if (!existingOrder) {
            return res.status(404).json({ message: 'ไม่พบออเดอร์นี้' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: id },
            data: { status: status } // เปลี่ยนสถานะ (เช่น Cooking, Completed)
        });

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};