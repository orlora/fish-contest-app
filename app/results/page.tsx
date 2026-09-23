'use client';

import { useState, useEffect } from 'react';

// กำหนด Type ของข้อมูล
interface ResultBlock {
  title: string;
  id: string;
  rank: string;
}

export default function ResultsPage() {
  const [classes, setClasses] = useState<string[]>(['รางวัลแชมป์']); // Default tab
  const [activeTab, setActiveTab] = useState<string>('รางวัลแชมป์');
  const [resultsBlocks, setResultsBlocks] = useState<ResultBlock[][]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลจาก Google Apps Script (ตอนโหลดหน้าเว็บ)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ใส่ URL ของ Google Apps Script (Web App) ของคุณ
        const response = await fetch(process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL as string);
        const json = await response.json();
        
        if (json.status === 'success') {
          // แท็บรางวัลแชมป์ เป็น default ตามรูป แล้วตามด้วย Class จาก Sheet
          setClasses(['รางวัลแชมป์', ...json.data.classes]);
          
          // ข้อมูลใน Sheet เรียงจากเก่า (บน) ไปใหม่ (ล่าง) 
          // หากอยากให้ ทัวร์ล่าสุด อยู่บนสุด ให้ใช้ .reverse() ได้
          setResultsBlocks(json.data.results.reverse()); 
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#101010] text-gray-300 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. Header Navigation (Tabs) */}
        <div className="flex overflow-x-auto space-x-2 border-b border-gray-800 pb-2 scrollbar-hide">
          {classes.map((cls, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(cls)}
              className={`whitespace-nowrap px-6 py-3 rounded-t-md text-sm font-medium transition-colors ${
                activeTab === cls 
                  ? 'bg-[#1a1a1a] text-[#d4af37] border-t border-l border-r border-[#333]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* 2. Search Bar */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 flex flex-col space-y-2">
          <label className="text-sm text-gray-400">ค้นหาผลรางวัล</label>
          <input 
            type="text" 
            placeholder="ค้นหาเลขโหล หรือชื่อผู้สมัคร เช่น 0012"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-gray-700 text-white rounded px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-colors"
          />
        </div>

        {/* 3. Loading State */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูลผลการแข่งขัน...</div>
        ) : (
          /* 4. Results Display (วนลูปทัวร์นาเมนต์/บล็อกข้อมูล) */
          resultsBlocks.map((block, blockIndex) => {
            // สมมติว่าตำแหน่งแรก [0] คือ Grand Champion และที่เหลือคือ Division
            const grandChamp = block[0];
            const subChamps = block.slice(1);

            return (
              <div key={blockIndex} className="space-y-4 mb-12">
                {/* Grand Champion Card (แถว 3 ที่ต้องการให้เด่น) */}
                {grandChamp && (
                  <div className="relative bg-[#151515] border border-[#d4af37]/60 rounded-xl p-6 md:p-8 flex justify-between items-end overflow-hidden group">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#d4af37] opacity-50 m-4"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-[#d4af37] opacity-50 m-4"></div>
                    
                    <div>
                      <h2 className="text-[#d4af37] text-xl md:text-2xl font-bold mb-1">{grandChamp.title}</h2>
                      <p className="text-sm text-gray-400">{grandChamp.rank}</p>
                    </div>
                    <div>
                      <span className="text-4xl md:text-6xl font-bold text-white tracking-wider">
                        {grandChamp.id}
                      </span>
                    </div>
                  </div>
                )}

                {/* Sub Division Cards (แถว 4 ถัดมาเรียงเป็น Grid) */}
                {subChamps.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {subChamps.map((item, idx) => (
                      <div key={idx} className="relative bg-[#151515] border border-gray-800 rounded-lg p-5 flex flex-col justify-between aspect-[4/3] hover:border-gray-600 transition-colors">
                         {/* Corner accents for sub cards */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-gray-600 opacity-30 m-3"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-gray-600 opacity-30 m-3"></div>
                        
                        <div>
                          <h3 className="text-sm font-semibold text-gray-300">{item.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{item.rank}</p>
                        </div>
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-white tracking-wide">{item.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}