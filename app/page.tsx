// app/page.tsx
'use client';
import { useState } from 'react';

export default function Home() {
  const [formData, setFormData] = useState({
    applicantName: '',
    phoneNumber: '',
    fishCount: '',
    billHeader: '',
    custodianName: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validation พื้นฐาน
    if (!formData.applicantName || !formData.phoneNumber || !formData.fishCount) {
      setMessage({ type: 'error', text: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
      setMessage({ type: 'error', text: 'กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก)' });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'บันทึกข้อมูลการสมัครเรียบร้อยแล้ว!' });
        setFormData({ applicantName: '', phoneNumber: '', fishCount: '', billHeader: '', custodianName: '' }); // เคลียร์ฟอร์ม
      } else {
        setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'ไม่สามารถเชื่อมต่อระบบได้' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">ฟอร์มสมัครแข่งขัน</h1>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-md text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้สมัคร <span className="text-red-500">*</span></label>
            <input type="text" name="applicantName" value={formData.applicantName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900" placeholder="นาย สมชาย ใจดี" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์ติดต่อ <span className="text-red-500">*</span></label>
            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} maxLength={10} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900" placeholder="0812345678" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนปลาที่ส่งประกวด <span className="text-red-500">*</span></label>
            <input type="number" name="fishCount" min="1" value={formData.fishCount} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900" placeholder="ระบุจำนวนตัว" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ผู้รับปลา (ถ้ามี)</label>
            <input type="text" name="custodianName" value={formData.custodianName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900" placeholder="ชื่อผู้รับปลาแทน" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-semibold rounded-md shadow-sm transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'กำลังบันทึกข้อมูล...' : 'บันทึกข้อมูลการสมัคร'}
          </button>
        </form>
      </div>
    </div>
  );
}