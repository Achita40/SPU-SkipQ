import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function StudentApp({ onBack }) {
  // --- States สำหรับระบบ Auth ---
  const [studentInfo, setStudentInfo] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [currentView, setCurrentView] = useState('student_login'); 

  // --- States สำหรับระบบสั่งอาหารและคิว ---
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  
  // States ใหม่สำหรับโปรไฟล์และการสุ่มเมนู
  const [orderHistory, setOrderHistory] = useState([]);
  const [suggestedMenu, setSuggestedMenu] = useState(null);

  // ---------------- ฟังก์ชันระบบสมาชิก ----------------
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
        const res = await fetch('http://localhost:5000/api/auth/student/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('skipq_student_token', data.token);
            setStudentInfo(data.student);
            setCurrentView('student_home');
        } else {
            setAuthError(data.message);
        }
    } catch (error) { setAuthError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'); }
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
        const res = await fetch('http://localhost:5000/api/auth/student/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: authName, email: authEmail, password: authPassword, phone: authPhone })
        });
        if (res.ok) {
            alert('สมัครสมาชิกสำเร็จ! กรุณาล็อกอิน');
            setCurrentView('student_login');
        } else {
            const data = await res.json();
            setAuthError(data.message);
        }
    } catch (error) { setAuthError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
        const res = await fetch('http://localhost:5000/api/auth/student/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail })
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.message);
            setCurrentView('student_login');
        } else {
            setAuthError(data.message);
        }
    } catch (error) { setAuthError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'); }
  };

  const handleStudentLogout = () => {
    localStorage.removeItem('skipq_student_token');
    setStudentInfo(null);
    setCurrentView('student_login');
  };

  // ---------------- ฟังก์ชันจัดการคิวและร้านค้า ----------------
  const handleReceiveOrder = (orderId) => {
    const updatedOrders = myOrders.filter(o => o.id !== orderId);
    setMyOrders(updatedOrders);
    
    const activeIds = updatedOrders.map(o => o.id);
    if (activeIds.length > 0) {
       localStorage.setItem('skipq_my_orders', JSON.stringify(activeIds));
    } else {
       localStorage.removeItem('skipq_my_orders');
       setCurrentView('student_home'); 
    }
  };

  useEffect(() => {
    if (currentView !== 'student_login' && currentView !== 'student_register' && currentView !== 'student_forgot') {
        loadMerchants();
    }
  }, [currentView]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('order_status_changed', (updatedOrder) => {
      setMyOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? { ...order, status: updatedOrder.status } : order
        )
      );
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const loadSavedOrders = async () => {
      const savedIdsStr = localStorage.getItem('skipq_my_orders');
      if (savedIdsStr) {
        try {
          const savedIds = JSON.parse(savedIdsStr);
          const activeOrders = [];
          
          for (const id of savedIds) {
            const res = await fetch(`http://localhost:5000/api/student/orders/${id}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.status !== 'Completed') {
                activeOrders.push(data);
              }
            }
          }
          
          setMyOrders(activeOrders);

          const activeIds = activeOrders.map(o => o.id);
          if (activeIds.length > 0) {
            localStorage.setItem('skipq_my_orders', JSON.stringify(activeIds));
          } else {
            localStorage.removeItem('skipq_my_orders');
          }
        } catch (err) { console.error("Error loading saved orders:", err); }
      }
    };
    loadSavedOrders();
  }, []);

  const loadMerchants = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/student/merchants');
      if (response.ok) setMerchants(await response.json());
    } catch (error) { console.error(error); }
  };

  const loadStudentProfile = async () => {
    const token = localStorage.getItem('skipq_student_token');
    try {
      const resProfile = await fetch('http://localhost:5000/api/student/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resProfile.ok) setStudentInfo(await resProfile.json());

      const resOrders = await fetch('http://localhost:5000/api/student/my-orders', { headers: { 'Authorization': `Bearer ${token}` } });
      if (resOrders.ok) setOrderHistory(await resOrders.json());
    } catch (error) { console.error(error); }
  };

  const handleRandomMenu = async () => {
    try {
        const res = await fetch('http://localhost:5000/api/student/random-menu');
        if (res.ok) {
            const menu = await res.json();
            setSuggestedMenu(menu);
        } else {
            alert('ยังไม่มีเมนูพร้อมขายให้สุ่มในขณะนี้ครับ 😅');
        }
    } catch (err) { console.error(err); }
  };

  const openStudentMenu = async (merchant) => {
    setSelectedMerchant(merchant);
    setCart([]); 
    setCurrentView('student_menu');
    try {
      const response = await fetch(`http://localhost:5000/api/student/merchants/${merchant.id}/menus`);
      if (response.ok) setMenus(await response.json());
    } catch (error) { console.error(error); }
  };

  const addToCart = (menu) => {
    const existing = cart.find(item => item.menuId === menu.id);
    if (existing) setCart(cart.map(item => item.menuId === menu.id ? { ...item, qty: item.qty + 1 } : item));
    else setCart([...cart, { menuId: menu.id, name: menu.name, price: menu.price, qty: 1, note: '' }]);
  };

  const updateCartQty = (menuId, delta) => {
    setCart(cart.map(item => {
      if (item.menuId === menuId) return { ...item, qty: Math.max(0, item.qty + delta) };
      return item;
    }).filter(item => item.qty > 0));
  };

  const updateCartNote = (menuId, noteText) => {
    setCart(cart.map(item =>
      item.menuId === menuId ? { ...item, note: noteText } : item
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const submitOrder = async () => {
    if (cart.length === 0) return alert('กรุณาเลือกเมนูก่อนสั่งอาหาร');
    
    const token = localStorage.getItem('skipq_student_token');

    try {
      const response = await fetch('http://localhost:5000/api/student/orders', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
            merchantId: selectedMerchant.id, 
            totalPrice: cartTotal, 
            items: cart,
            studentName: studentInfo ? studentInfo.name : 'นักศึกษา' 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const newOrder = data.order;
        
        setMyOrders(prev => [...prev, newOrder]);
        
        const savedIdsStr = localStorage.getItem('skipq_my_orders');
        const savedIds = savedIdsStr ? JSON.parse(savedIdsStr) : [];
        savedIds.push(newOrder.id);
        localStorage.setItem('skipq_my_orders', JSON.stringify(savedIds));
        
        setCart([]); 
        setCurrentView('order_tracking'); 
      } else {
        const errData = await response.json();
        alert(`เกิดข้อผิดพลาด: ${errData.message}`);
        if (response.status === 401) {
            handleStudentLogout(); 
        }
      }
    } catch (error) { console.error(error); }
  };

  // ---------------- UI Rendering ----------------

  if (currentView === 'student_login' || currentView === 'student_register' || currentView === 'student_forgot') {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px' }}>
            <div style={{ backgroundColor: '#FFF', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', marginBottom: '16px' }}>← กลับหน้าหลัก</button>
                
                <h1 style={{ color: '#7C3AED', margin: '0 0 16px 0', textAlign: 'center', fontSize: '24px' }}>
                    {currentView === 'student_login' ? 'เข้าสู่ระบบ (นักศึกษา)' : currentView === 'student_register' ? 'สมัครสมาชิก' : 'ลืมรหัสผ่าน'}
                </h1>
                
                {authError && <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontSize: '14px' }}>{authError}</div>}
                
                <form onSubmit={currentView === 'student_login' ? handleStudentLogin : currentView === 'student_register' ? handleStudentRegister : handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {currentView === 'student_register' && (
                        <>
                            <input type="text" placeholder="ชื่อ-นามสกุล" value={authName} onChange={e => setAuthName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                            <input type="tel" placeholder="เบอร์โทรศัพท์" value={authPhone} onChange={e => setAuthPhone(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                        </>
                    )}
                    
                    <input type="email" placeholder="อีเมล @spumail.net" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                    
                    {currentView !== 'student_forgot' && (
                        <input type="password" placeholder="รหัสผ่าน" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                    )}
                    
                    <button type="submit" style={{ padding: '14px', backgroundColor: '#7C3AED', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                        {currentView === 'student_login' ? 'เข้าสู่ระบบ' : currentView === 'student_register' ? 'สมัครสมาชิก' : 'รีเซ็ตรหัสผ่าน'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' }}>
                    {currentView === 'student_login' && (
                        <>
                            <button onClick={() => { setCurrentView('student_register'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer' }}>ยังไม่มีบัญชี? สมัครสมาชิก</button>
                            <button onClick={() => { setCurrentView('student_forgot'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '13px' }}>ลืมรหัสผ่าน?</button>
                        </>
                    )}
                    {currentView !== 'student_login' && (
                        <button onClick={() => { setCurrentView('student_login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}>กลับไปหน้าเข้าสู่ระบบ</button>
                    )}
                </div>
            </div>
        </div>
    );
  }

  if (currentView === 'student_home') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <nav style={{ backgroundColor: '#FFFFFF', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#7C3AED' }}>SPU SkipQ (นักศึกษา)</h1>
            {studentInfo && <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>ยินดีต้อนรับ, {studentInfo.name}</div>}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button onClick={() => { setCurrentView('student_profile'); loadStudentProfile(); }} style={{ background: 'none', border: 'none', fontSize: '14px', color: '#3B82F6', cursor: 'pointer', fontWeight: '500' }}>โปรไฟล์ของฉัน</button>
            <button onClick={handleStudentLogout} style={{ background: 'none', border: 'none', fontSize: '14px', color: '#EF4444', cursor: 'pointer' }}>ออกจากระบบ</button>
          </div>
        </nav>

        {suggestedMenu && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
                <div style={{ backgroundColor: '#FFF', padding: '32px', borderRadius: '16px', maxWidth: '350px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'bounce 1s infinite' }}>✨🍽️</div>
                    <h2 style={{ margin: '0 0 12px 0', color: '#7C3AED' }}>วันนี้กินนี่สิ!</h2>
                    <h3 style={{ fontSize: '22px', margin: '0 0 12px 0', color: '#111827' }}>{suggestedMenu.name}</h3>
                    <div style={{ color: '#6B7280', fontSize: '15px', marginBottom: '8px' }}>จากร้าน: <span style={{fontWeight: '500', color: '#374151'}}>{suggestedMenu.merchant.name}</span></div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', marginBottom: '24px' }}>฿{suggestedMenu.price}</div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => {
                            setSuggestedMenu(null);
                            openStudentMenu(suggestedMenu.merchant);
                        }} style={{ flex: 1, padding: '14px', backgroundColor: '#7C3AED', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                            ไปที่ร้านนี้เลย
                        </button>
                        <button onClick={() => setSuggestedMenu(null)} style={{ padding: '14px 20px', backgroundColor: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                            ปิด
                        </button>
                    </div>
                </div>
            </div>
        )}

        <main style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          
          <button 
             onClick={handleRandomMenu} 
             style={{ width: '100%', padding: '16px', backgroundColor: '#111827', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
          >
             🎲 คิดไม่ออก? กดให้ระบบสุ่มเมนูให้เลย!
          </button>

          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>ร้านค้าที่เปิดอยู่ขณะนี้</h2>
          
          {myOrders.length > 0 && (
              <div 
                onClick={() => setCurrentView('order_tracking')}
                style={{ padding: '16px', backgroundColor: '#DBEAFE', border: '1px solid #2563EB', borderRadius: '8px', marginBottom: '16px', cursor: 'pointer' }}
              >
                  <strong style={{ color: '#1D4ED8' }}>คุณมีออเดอร์ที่กำลังดำเนินการ ({myOrders.length} รายการ) - คลิกเพื่อดูสถานะ</strong>
              </div>
          )}

          <div style={{ display: 'grid', gap: '16px' }}>
            {merchants.map(m => (
              <div key={m.id} onClick={() => openStudentMenu(m)} style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ fontSize: '16px', fontWeight: '500' }}>{m.name}</span>
                <span style={{ color: '#10B981', fontSize: '14px', fontWeight: '500' }}>เปิดรับออเดอร์</span>
              </div>
            ))}
            {merchants.length === 0 && <p style={{ textAlign: 'center', color: '#6B7280' }}>ยังไม่มีร้านค้าเปิดทำการ</p>}
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'student_menu') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', paddingBottom: '100px' }}>
        <nav style={{ backgroundColor: '#FFFFFF', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <button onClick={() => setCurrentView('student_home')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>←</button>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{selectedMerchant?.name}</h1>
        </nav>
        <main style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '16px', color: '#6B7280', marginBottom: '16px' }}>รายการเมนู</h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {menus.map(menu => {
              const inCart = cart.find(c => c.menuId === menu.id);
              return (
                <div key={menu.id} style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {menu.imageUrl ? (
                      <img src={menu.imageUrl} alt={menu.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', backgroundColor: '#F3F4F6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🍽️</div>
                    )}
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '500' }}>{menu.name}</div>
                      <div style={{ fontSize: '14px', color: '#7C3AED', marginTop: '4px' }}>฿{menu.price}</div>
                    </div>
                  </div>
                  {inCart ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => updateCartQty(menu.id, -1)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}>-</button>
                      <span style={{ fontWeight: '500', width: '20px', textAlign: 'center' }}>{inCart.qty}</span>
                      <button onClick={() => updateCartQty(menu.id, 1)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#7C3AED', color: '#FFF', border: 'none', cursor: 'pointer' }}>+</button>
                      <input 
                            type="text" 
                            placeholder="หมายเหตุ (เช่น ไม่เผ็ด)" 
                            value={inCart.note || ''} 
                            onChange={(e) => updateCartNote(menu.id, e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #D1D5DB', width: '130px' }}
                        />
                    </div>
                  ) : (
                    <button onClick={() => addToCart(menu)} style={{ padding: '8px 16px', backgroundColor: '#111827', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>เพิ่ม</button>
                  )}
                </div>
              );
            })}
          </div>
          {cart.length > 0 && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
              <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>ยอดรวมทั้งหมด</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>฿{cartTotal}</div>
                </div>
                <button onClick={submitOrder} style={{ padding: '14px 32px', backgroundColor: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>สั่งอาหารเลย</button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === 'order_tracking') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0 }}>รายการคิวของคุณ</h2>
            <button onClick={() => setCurrentView('student_home')} style={{ padding: '8px 16px', backgroundColor: '#E5E7EB', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>← สั่งร้านอื่นเพิ่ม</button>
          </div>

          {myOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>ไม่มีออเดอร์ที่กำลังดำเนินการ</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {myOrders.map(order => (
                <div key={order.id} style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '16px', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px' }}>คิวที่ {order.queueNumber}</h3>
                    <div style={{ padding: '8px 16px', backgroundColor: order.status === 'Completed' ? '#10B981' : (order.status === 'Cooking' ? '#F59E0B' : '#F3F4F6'), color: order.status === 'Pending' ? '#374151' : '#FFF', borderRadius: '999px', fontWeight: '600', fontSize: '14px' }}>
                      {order.status === 'Pending' ? 'รอรับออเดอร์' : (order.status === 'Cooking' ? 'กำลังทำอาหาร' : 'พร้อมเสิร์ฟ')}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '24px' }}>
                    {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
                        <span>{item.qty}x {item.name || 'เมนู'}</span>
                        {item.note && <div style={{ fontSize: '13px', color: '#EF4444', marginTop: '2px' }}>* {item.note}</div>}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: '600' }}>
                    <span>ยอดรวม:</span>
                    <span style={{ color: '#7C3AED' }}>฿{order.totalPrice}</span>
                  </div>

                  {order.status === 'Completed' && (
                    <button 
                      onClick={() => handleReceiveOrder(order.id)} 
                      style={{ marginTop: '20px', width: '100%', padding: '14px', backgroundColor: '#111827', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      รับอาหารเรียบร้อย
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'student_profile') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
        <nav style={{ backgroundColor: '#FFFFFF', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #E5E7EB' }}>
          <button onClick={() => setCurrentView('student_home')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>←</button>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>โปรไฟล์ของฉัน</h1>
        </nav>

        <main style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#7C3AED' }}>ข้อมูลส่วนตัว</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#374151', fontSize: '15px' }}>
                  <div><strong>ชื่อ-นามสกุล:</strong> {studentInfo?.name}</div>
                  <div><strong>อีเมล:</strong> {studentInfo?.email}</div>
                  <div><strong>เบอร์โทร:</strong> {studentInfo?.phone || '-'}</div>
              </div>
          </div>

          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>ประวัติการสั่งอาหารล่าสุด</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orderHistory.length === 0 ? (
                  <div style={{ backgroundColor: '#FFF', padding: '40px', textAlign: 'center', borderRadius: '12px', color: '#6B7280', border: '1px dashed #D1D5DB' }}>
                    ยังไม่มีประวัติการสั่งอาหาร
                  </div>
              ) : (
                  orderHistory.map(order => (
                      <div key={order.id} style={{ backgroundColor: '#FFF', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>
                              <div>
                                  <div style={{ fontWeight: '600', color: '#111827' }}>{order.merchant?.name || 'ร้านค้า'}</div>
                                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                                    {new Date(order.createdAt).toLocaleString('th-TH')} • คิวที่ {order.queueNumber}
                                  </div>
                              </div>
                              <div style={{ fontWeight: '600', color: '#7C3AED', fontSize: '16px' }}>฿{order.totalPrice}</div>
                          </div>
                          <div style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.6' }}>
                              {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => (
                                  <div key={idx}>{item.qty}x {item.name}</div>
                              ))}
                          </div>
                      </div>
                  ))
              )}
          </div>
        </main>
      </div>
    );
  }

  return null;
}

export default StudentApp;