// app/api/register/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // จัดเตรียมข้อมูลให้ตรงกับ Array ในชีต "deposits"
    // โครงสร้าง: ["ID*", "billHeader", "applicantName", "custodianName", "phoneNumber", "fishCount"]
    const payload = {
      sheetName: "deposits",
      data: [
        `DEP${Date.now()}`, // สร้าง ID อัตโนมัติจาก Timestamp
        body.billHeader || "-",
        body.applicantName,
        body.custodianName || "-",
        body.phoneNumber,
        body.fishCount
      ]
    };

    // ยิงข้อมูลไปที่ Google Apps Script
    // GOOGLE_SCRIPT_URL จะถูกตั้งค่าไว้ใน Environment Variables ของ Vercel
    const response = await fetch(process.env.GOOGLE_SCRIPT_URL as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return NextResponse.json({ success: true, data: result }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}