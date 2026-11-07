export const db = {
  merchants: [
    { id: "M01", name: "ร้านป้าแจ่ม ตามสั่ง", isOpen: true }
  ],
  menus: [
    { id: "F01", merchantId: "M01", name: "ข้าวกะเพราหมูสับ+ไข่ดาว", price: 45 },
    { id: "F02", merchantId: "M01", name: "ข้าวผัดหมู", price: 40 },
    { id: "F03", merchantId: "M01", name: "สุกี้น้ำไก่", price: 40 }
  ],
  orders: [
    {
      orderId: "ORD-001",
      queueNumber: "A01",
      status: "Pending", // สถานะ: Pending, Cooking, Ready, Completed
      totalPrice: 45,
      items: [
        { menuId: "F01", qty: 1, note: "เผ็ดน้อย" }
      ]
    },
    {
      orderId: "ORD-002",
      queueNumber: "A02",
      status: "Cooking",
      totalPrice: 80,
      items: [
        { menuId: "F02", qty: 2, note: "" }
      ]
    }
  ]
};