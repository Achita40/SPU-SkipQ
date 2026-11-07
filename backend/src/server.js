// ไฟล์: backend/src/server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const path = require('path'); // ✅ จุดที่ 1: เพิ่ม path สำหรับจัดการตำแหน่งโฟลเดอร์
require('dotenv').config();

// นำเข้าไฟล์ Routes ที่เราเพิ่งสร้าง
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const orderRoutes = require('./routes/orderRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();

const adminRoutes = require('./routes/adminRoutes'); 

// ตั้งค่าให้ React เชื่อมต่อเข้ามาได้
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ✅ จุดที่ 2: อนุญาตให้ React ดึงรูปจากโฟลเดอร์ uploads ไปแสดงผลได้
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ----------------- ใช้งาน ROUTES -----------------
app.use('/api/auth', authRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/student', studentRoutes);

app.use('/api/admin', adminRoutes); // เพิ่ม Route สำหรับ Admin

// ตั้งค่าระบบ Real-time (Socket.io)
const io = new Server(server, {
    cors: { origin: 'http://localhost:5173' }
});

// นำ io ไปฝากไว้ในตัวแปร app เพื่อให้ controller ดึงไปใช้ได้
app.set('io', io);

io.on('connection', (socket) => {
    console.log('🔗 Client connected:', socket.id);
    
    // ไว้สำหรับรับ-ส่งข้อมูลอัปเดตสถานะคิวในอนาคต
    socket.on('update_order_status', (data) => {
        io.emit('order_status_changed', data);
    });

    socket.on('disconnect', () => console.log('❌ Client disconnected:', socket.id));
});

// ----------------- API เช็กสถานะ -----------------

// เช็กสถานะเซิร์ฟเวอร์
app.get('/api/status', (req, res) => {
    res.json({ message: 'Backend SPU SkipQ is running! 🚀' });
});

// ดึงข้อมูลร้านค้าทั้งหมด (สำหรับทดสอบ)
app.get('/api/merchants', async (req, res) => {
    try {
        const merchants = await prisma.merchant.findMany();
        res.json(merchants);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------------------------------

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});