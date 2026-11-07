import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function MerchantApp({ onBack }) {
  const [token, setToken] = useState(localStorage.getItem('skipq_token'));
  const [currentView, setCurrentView] = useState(token ? 'dashboard' : 'login'); // 'login' | 'register' | 'dashboard' | 'settings' | 'summary'
  const [merchant, setMerchant] = useState(null);
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);

  // States สำหรับฟอร์มเข้าสู่ระบบ/สมัครสมาชิก
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // States สำหรับฟอร์มเพิ่ม/แก้ไขเมนู
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuImage, setNewMenuImage] = useState('');
  const [editingMenuId, setEditingMenuId] = useState(null);

  useEffect(() => {
    if (token) {
      loadMerchantData();
      loadMenus();
      loadOrders();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = io('http://localhost:5000');
    socket.on('new_order', (order) => {
      // เล่นเสียงแจ้งเตือนเมื่อมีออเดอร์ใหม่
      const audio = new Audio('https://www.soundjay.com/buttons/sounds/bell-ringing-05.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
      setOrders(prev => [order, ...prev]);
    });
    return () => socket.disconnect();
  }, [token]);

  // ---------------- API Calls ----------------

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('skipq_token', data.token);
        setToken(data.token);
        setCurrentView('dashboard');
      } else { alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); }
    } catch (error) { console.error(error); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // แนบอีเมลและเบอร์โทรไปด้วย
        body: JSON.stringify({ name, username, password, email, phone })
      });
      if (response.ok) {
        alert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
        setCurrentView('login');
      } else { alert('ไม่สามารถสมัครได้ (Username อาจซ้ำ)'); }
    } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
    localStorage.removeItem('skipq_token');
    setToken(null);
    setCurrentView('login');
  };

  const loadMerchantData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/merchant/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setMerchant(await response.json());
    } catch (error) { console.error(error); }
  };

  const toggleStoreStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/merchant/status', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) loadMerchantData();
    } catch (error) { console.error(error); }
  };

  const loadMenus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/menus', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setMenus(await response.json());
    } catch (error) { console.error(error); }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/merchant/orders', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setOrders(await response.json());
    } catch (error) { console.error(error); }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/merchant/summary', { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) setSummary(await response.json());
    } catch (error) { console.error(error); }
  };

  const addMenu = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newMenuName, price: parseFloat(newMenuPrice), imageUrl: newMenuImage })
      });
      if (response.ok) {
        setNewMenuName(''); setNewMenuPrice(''); setNewMenuImage('');
        loadMenus();
      }
    } catch (error) { console.error(error); }
  };

  const updateMenu = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/menus/${editingMenuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newMenuName, price: parseFloat(newMenuPrice), imageUrl: newMenuImage })
      });
      if (response.ok) {
        setEditingMenuId(null); setNewMenuName(''); setNewMenuPrice(''); setNewMenuImage('');
        loadMenus();
      }
    } catch (error) { console.error(error); }
  };

  const deleteMenu = async (id) => {
    if(!window.confirm('ยืนยันการลบเมนูนี้?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/menus/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) loadMenus();
    } catch (error) { console.error(error); }
  };

  const toggleMenuStatus = async (menu) => {
    try {
      const response = await fetch(`http://localhost:5000/api/menus/${menu.id}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedMenu = await response.json();
        setMenus(menus.map(m => m.id === menu.id ? updatedMenu : m));
      }
    } catch (error) { console.error(error); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/merchant/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (response.ok) loadOrders();
    } catch (error) { console.error(error); }
  };

  const startEditMenu = (menu) => {
    setEditingMenuId(menu.id);
    setNewMenuName(menu.name);
    setNewMenuPrice(menu.price);
    setNewMenuImage(menu.imageUrl || '');
  };

  // ---------------- UI Rendering ----------------

  if (!token) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px' }}>
        <div style={{ backgroundColor: '#FFF', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', marginBottom: '16px' }}>← กลับหน้าหลัก</button>
          <h1 style={{ color: '#7C3AED', margin: '0 0 24px 0', textAlign: 'center' }}>
            {currentView === 'login' ? 'เข้าสู่ระบบร้านค้า' : 'สมัครเปิดร้านค้า'}
          </h1>
          <form onSubmit={currentView === 'login' ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {currentView === 'register' && (
              <>
                <input type="text" placeholder="ชื่อร้านค้า" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                {/* เพิ่มช่องกรอกอีเมลและเบอร์โทร */}
                <input type="email" placeholder="อีเมลติดต่อ (ทางเลือก)" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                <input type="tel" placeholder="เบอร์โทรศัพท์ (ทางเลือก)" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
              </>
            )}
            <input type="text" placeholder="ชื่อผู้ใช้ (Username)" value={username} onChange={e => setUsername(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
            <input type="password" placeholder="รหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
            <button type="submit" style={{ padding: '14px', backgroundColor: '#7C3AED', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              {currentView === 'login' ? 'เข้าสู่ระบบ' : 'ลงทะเบียน'}
            </button>
          </form>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button onClick={() => setCurrentView(currentView === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>
              {currentView === 'login' ? 'สมัครเปิดร้านใหม่' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <nav style={{ backgroundColor: '#FFFFFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#7C3AED' }}>SPU SkipQ</h1>
          <button onClick={() => setCurrentView('dashboard')} style={{ background: 'none', border: 'none', fontWeight: currentView === 'dashboard' ? '600' : '400', cursor: 'pointer' }}>ออเดอร์</button>
          <button onClick={() => setCurrentView('settings')} style={{ background: 'none', border: 'none', fontWeight: currentView === 'settings' ? '600' : '400', cursor: 'pointer' }}>จัดการร้าน</button>
          <button onClick={() => { setCurrentView('summary'); loadSummary(); }} style={{ background: 'none', border: 'none', fontWeight: currentView === 'summary' ? '600' : '400', cursor: 'pointer' }}>สรุปยอดขาย</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: '500' }}>{merchant?.name}</span>
          <button onClick={handleLogout} style={{ padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', background: '#FFF', cursor: 'pointer' }}>ออก</button>
        </div>
      </nav>

      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ----------- Dashboard ----------- */}
        {currentView === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>ออเดอร์ที่กำลังดำเนินการ</h2>
              <button 
                onClick={toggleStoreStatus} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', color: '#FFF', cursor: 'pointer', backgroundColor: merchant?.isOpen ? '#EF4444' : '#10B981' }}
              >
                {merchant?.isOpen ? 'ปิดรับออเดอร์ชั่วคราว' : 'เปิดรับออเดอร์'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {orders.filter(o => o.status !== 'Completed').map(order => (
                <div key={order.id} style={{ backgroundColor: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                  
                  {/* แสดงชื่อนักศึกษา */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>คิว {order.queueNumber}</h3>
                      <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                        สั่งโดย: <span style={{ color: '#7C3AED', fontWeight: '600' }}>{order.studentName || 'นักศึกษาทั่วไป'}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: order.status === 'Cooking' ? '#F59E0B' : '#374151' }}>
                      {order.status === 'Pending' ? 'รอรับออเดอร์' : 'กำลังทำอาหาร'}
                    </span>
                  </div>

                  <div style={{ flexGrow: 1, fontSize: '14px', marginBottom: '16px' }}>
                    {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => (
                      <div key={idx}>{item.qty}x {item.name || menus.find(m => m.id === item.menuId)?.name}</div>
                    ))}
                  </div>
                  
                  {order.status === 'Pending' && <button onClick={() => updateOrderStatus(order.id, 'Cooking')} style={{ width: '100%', padding: '12px', backgroundColor: '#111827', color: '#FFF', borderRadius: '8px', cursor: 'pointer' }}>รับออเดอร์</button>}
                  {order.status === 'Cooking' && <button onClick={() => updateOrderStatus(order.id, 'Completed')} style={{ width: '100%', padding: '12px', backgroundColor: '#7C3AED', color: '#FFF', borderRadius: '8px', cursor: 'pointer' }}>พร้อมเสิร์ฟ</button>}
                </div>
              ))}
              {orders.filter(o => o.status !== 'Completed').length === 0 && <p style={{ color: '#6B7280' }}>ยังไม่มีออเดอร์ใหม่</p>}
            </div>
          </div>
        )}

        {/* ----------- Settings (จัดการเมนู) ----------- */}
        {currentView === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
            <div>
              <h2 style={{ marginBottom: '16px' }}>{editingMenuId ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
              <form onSubmit={editingMenuId ? updateMenu : addMenu} style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <input type="text" placeholder="ชื่อเมนู" value={newMenuName} onChange={e => setNewMenuName(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
                <input type="number" placeholder="ราคา (บาท)" value={newMenuPrice} onChange={e => setNewMenuPrice(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
                <input type="text" placeholder="URL รูปภาพ (ทางเลือก)" value={newMenuImage} onChange={e => setNewMenuImage(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #D1D5DB' }} />
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#111827', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    {editingMenuId ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}
                  </button>
                  {editingMenuId && (
                    <button type="button" onClick={() => { setEditingMenuId(null); setNewMenuName(''); setNewMenuPrice(''); setNewMenuImage(''); }} style={{ padding: '10px', backgroundColor: '#E5E7EB', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div>
              <h2 style={{ marginBottom: '16px' }}>รายการเมนูของร้าน</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {menus.map(menu => (
                  <div key={menu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {menu.imageUrl && <img src={menu.imageUrl} alt={menu.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', opacity: menu.isAvailable !== false ? 1 : 0.5 }} />}
                      <div>
                        <div style={{ fontWeight: '500', color: menu.isAvailable !== false ? '#111827' : '#9CA3AF' }}>
                          {menu.name} {menu.isAvailable === false && '(หมด)'}
                        </div>
                        <div style={{ color: '#7C3AED', fontSize: '14px' }}>฿{menu.price}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* ปุ่มซ่อน/เปิดขาย */}
                      <button onClick={() => toggleMenuStatus(menu)} style={{ padding: '8px 16px', color: menu.isAvailable !== false ? '#F59E0B' : '#10B981', background: 'none', border: `1px solid ${menu.isAvailable !== false ? '#F59E0B' : '#10B981'}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                        {menu.isAvailable !== false ? 'ซ่อน (หมด)' : 'เปิดขาย'}
                      </button>
                      
                      <button onClick={() => startEditMenu(menu)} style={{ padding: '8px 16px', color: '#3B82F6', background: 'none', border: '1px solid #3B82F6', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>แก้ไข</button>
                      <button onClick={() => deleteMenu(menu.id)} style={{ padding: '8px 16px', color: '#EF4444', background: 'none', border: '1px solid #EF4444', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>ลบ</button>
                    </div>
                  </div>
                ))}
                {menus.length === 0 && <p style={{ color: '#6B7280' }}>ยังไม่มีเมนูในระบบ</p>}
              </div>
            </div>
          </div>
        )}

        {/* ----------- Summary (สรุปยอดขาย) ----------- */}
        {currentView === 'summary' && summary && (
          <div>
            <h2 style={{ marginBottom: '24px' }}>สรุปยอดขายประจำวัน</h2>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
              <div style={{ flex: 1, backgroundColor: '#7C3AED', color: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '16px', opacity: 0.9 }}>รายได้วันนี้</div>
                <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px' }}>฿{summary.totalSales.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, backgroundColor: '#10B981', color: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '16px', opacity: 0.9 }}>จำนวนออเดอร์ที่เสร็จสิ้น</div>
                <div style={{ fontSize: '36px', fontWeight: '700', marginTop: '8px' }}>{summary.totalOrders} <span style={{ fontSize: '18px', fontWeight: '400' }}>คิว</span></div>
              </div>
            </div>

            <h3 style={{ marginBottom: '16px' }}>ประวัติการขายวันนี้</h3>
            <div style={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <tr>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#6B7280' }}>เลขคิว</th>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#6B7280' }}>ลูกค้า</th>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#6B7280' }}>รายการอาหาร</th>
                    <th style={{ padding: '16px', fontWeight: '500', color: '#6B7280' }}>ยอดเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.orders.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>ยังไม่มีออเดอร์ที่เสร็จสิ้นในวันนี้</td></tr>
                  ) : (
                    summary.orders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '16px', fontWeight: '500' }}>{order.queueNumber}</td>
                        <td style={{ padding: '16px' }}>{order.studentName || 'นักศึกษา'}</td>
                        <td style={{ padding: '16px', color: '#6B7280', fontSize: '14px' }}>
                          {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => (
                            <div key={idx}>{item.qty}x {item.name}</div>
                          ))}
                        </td>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#111827' }}>฿{order.totalPrice}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default MerchantApp;