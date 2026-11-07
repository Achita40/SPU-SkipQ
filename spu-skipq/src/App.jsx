import { useState } from 'react';
import MerchantApp from './MerchantApp';
import StudentApp from './StudentApp';
import './App.css';
import AdminApp from './AdminApp';

function App() {
  const [appMode, setAppMode] = useState(null); // 'merchant' | 'student' | 'admin' | null

  if (appMode === 'merchant') {
    return <MerchantApp onBack={() => setAppMode(null)} />;
  }

  if (appMode === 'student') {
    return <StudentApp onBack={() => setAppMode(null)} />;
  }

  if (appMode === 'admin') {
    return <AdminApp onBack={() => setAppMode(null)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px' }}>
      <div style={{ backgroundColor: '#FFFFFF', padding: '40px', borderRadius: '16px', border: '1px solid #E5E7EB', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
        
        <h1 style={{ color: '#7C3AED', margin: '0 0 16px 0', fontSize: '32px' }}>SPU SkipQ</h1>
        <p style={{ color: '#6B7280', marginBottom: '32px' }}>เลือกระบบที่คุณต้องการใช้งาน</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button 
            onClick={() => setAppMode('student')} 
            style={{ width: '100%', padding: '16px', backgroundColor: '#7C3AED', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            🎓 นักศึกษา (สั่งอาหาร)
          </button>

          <button 
            onClick={() => setAppMode('merchant')} 
            style={{ width: '100%', padding: '16px', backgroundColor: '#111827', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            🏪 ร้านค้า (จัดการออเดอร์)
          </button>

          <button 
            onClick={() => setAppMode('admin')} 
            style={{ width: '100%', padding: '16px', backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
          >
            ⚙️ ผู้ดูแลระบบ (Admin)
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;