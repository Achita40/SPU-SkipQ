import React, { useState, useEffect } from 'react';

function AdminApp({ onBack }) {
  const [token, setToken] = useState(localStorage.getItem('skipq_admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [students, setStudents] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [activeTab, setActiveTab] = useState('students');

  useEffect(() => {
    if (token) loadUsers();
  }, [token]);

  const loadUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setMerchants(data.merchants);
      } else {
         // ถ้า Token หมดอายุ
         handleLogout();
      }
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('skipq_admin_token', data.token);
        setToken(data.token);
      } else { alert('Username หรือ Password ไม่ถูกต้อง'); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`ยืนยันการลบ ${name} ออกจากระบบ? (การกระทำนี้ย้อนกลับไม่ได้)`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('ลบข้อมูลสำเร็จ');
        loadUsers(); // โหลดข้อมูลใหม่
      }
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('skipq_admin_token');
    setToken(null);
  };

  // --- หน้า Login ---
  if (!token) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#111827', padding: '24px' }}>
        <div style={{ backgroundColor: '#1F2937', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', color: '#FFF' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', marginBottom: '16px' }}>← กลับหน้าหลัก</button>
          <h1 style={{ color: '#F87171', margin: '0 0 24px 0', textAlign: 'center' }}>Admin SPU SkipQ</h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" placeholder="Username แอดมิน" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#374151', color: '#FFF' }} />
            <input type="password" placeholder="รหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#374151', color: '#FFF' }} />
            <button type="submit" style={{ padding: '14px', backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>เข้าสู่ระบบผู้ดูแล</button>
          </form>
        </div>
      </div>
    );
  }

  // --- หน้า Dashboard แอดมิน ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <nav style={{ backgroundColor: '#111827', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#FFF' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#F87171' }}>System Admin - ควบคุมระบบ</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}>หน้าแรก</button>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}>ออกจากระบบ</button>
        </div>
      </nav>
      
      <main style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        {/* สถิติรวม */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div style={{ flex: 1, backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#6B7280', marginBottom: '8px' }}>นักศึกษาทั้งหมด (บัญชี)</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#3B82F6' }}>{students.length}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#6B7280', marginBottom: '8px' }}>ร้านค้าในระบบ (ร้าน)</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10B981' }}>{merchants.length}</div>
          </div>
        </div>

        {/* แท็บเลือกดูข้อมูล */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setActiveTab('students')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'students' ? '#3B82F6' : '#E5E7EB', color: activeTab === 'students' ? '#FFF' : '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>รายชื่อนักศึกษา</button>
          <button onClick={() => setActiveTab('merchants')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'merchants' ? '#10B981' : '#E5E7EB', color: activeTab === 'merchants' ? '#FFF' : '#374151', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>รายชื่อร้านค้า</button>
        </div>

        {/* ตารางแสดงข้อมูล Users */}
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '16px', color: '#6B7280', width: '60px', textAlign: 'center' }}>ลำดับ</th>
                <th style={{ padding: '16px', color: '#6B7280' }}>ชื่อ / Username</th>
                <th style={{ padding: '16px', color: '#6B7280' }}>ข้อมูลติดต่อ</th>
                <th style={{ padding: '16px', color: '#6B7280' }}>สถานะ</th>
                <th style={{ padding: '16px', color: '#6B7280', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'students' ? (
                students.map((s, index) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{s.name}</td>
                    
                    {/* อัปเดต: แสดงอีเมลและเบอร์โทรของนักศึกษา */}
                    <td style={{ padding: '16px', color: '#6B7280', fontSize: '14px' }}>
                      <div style={{ marginBottom: '4px' }}>📧 {s.email}</div>
                      <div>📞 {s.phone || '-'}</div>
                    </td>

                    <td style={{ padding: '16px' }}><span style={{ padding: '4px 8px', backgroundColor: '#DBEAFE', color: '#1D4ED8', borderRadius: '4px', fontSize: '12px' }}>นักศึกษา</span></td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete('student', s.id, s.name)} style={{ padding: '6px 12px', backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>ลบบัญชี</button>
                    </td>
                  </tr>
                ))
              ) : (
                merchants.map((m, index) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>{index + 1}</td>
                    
                    {/* อัปเดต: ย้าย Username มาแสดงใต้ชื่อร้านค้า */}
                    <td style={{ padding: '16px', fontWeight: '500' }}>
                      {m.name}
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>User: {m.username}</div>
                    </td>
                    
                    {/* อัปเดต: แสดงอีเมลและเบอร์โทรของร้านค้า */}
                    <td style={{ padding: '16px', color: '#6B7280', fontSize: '14px' }}>
                      <div style={{ marginBottom: '4px' }}>📧 {m.email || '-'}</div>
                      <div>📞 {m.phone || '-'}</div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 8px', backgroundColor: m.isOpen ? '#D1FAE5' : '#FEE2E2', color: m.isOpen ? '#047857' : '#DC2626', borderRadius: '4px', fontSize: '12px' }}>
                        {m.isOpen ? 'เปิดร้านอยู่' : 'ปิดร้าน'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete('merchant', m.id, m.name)} style={{ padding: '6px 12px', backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>ลบร้านค้า</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default AdminApp;