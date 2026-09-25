'use client';

import { useState } from 'react';

interface ResultBlock {
  title: string;
  id: string;
  rank: string;
}

export default function ResultsPage() {
  const [classes] = useState<string[]>(['รางวัลแชมป์', 'Division A', 'Division B', 'Division C', 'Division D', 'Division E']);
  const [activeTab, setActiveTab] = useState<string>('รางวัลแชมป์');
  const [searchQuery, setSearchQuery] = useState('');

  // ---------------------------------------------------------
  // MOCK DATA: ข้อมูลจำลองเพื่อให้เห็น UI ทันที
  // ---------------------------------------------------------
  const mockData: ResultBlock[][] = [
    [
      // index 0: แชมป์ใหญ่ (Grand Champion)
      { title: "Grand Champion\nApc Betta Farm\nB9", id: "0728", rank: "" },
      // index 1 เป็นต้นไป: แชมป์ดิวิชั่น
      { title: "Division Champion A\nSivarang\nA5", id: "0072", rank: "" },
      { title: "Division Champion B\nApc Betta Farm\nB9", id: "0728", rank: "" },
      { title: "Division Champion C\nRich Betta\nC4", id: "0671", rank: "" },
      { title: "Division Champion D\nArmmywarr x สมโชค\nD4", id: "0869", rank: "" },
      { title: "Division Champion E\nThe Giant\nE7", id: "0985", rank: "" },
    ]
  ];

  // ใช้ Mock Data แทน State ที่รอ API
  const resultsBlocks = mockData;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 1. Header Navigation (Tabs) */}
        <div className="flex overflow-x-auto space-x-1 border-b border-[#222] pb-0 scrollbar-hide">
          {classes.map((cls, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(cls)}
              className={`whitespace-nowrap px-8 py-4 text-sm font-medium transition-colors ${
                activeTab === cls 
                  ? 'bg-[#151515] text-[#d4af37] border-t-2 border-[#d4af37]' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* 2. Search Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <label>ค้นหาผลรางวัล</label>
            <span>216 ผลประกาศ</span>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-lg p-1">
            <input 
              type="text" 
              placeholder="ค้นหาเลขโหล หรือชื่อผู้สมัคร เช่น 0012"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-white rounded px-4 py-3 focus:outline-none focus:border-[#d4af37] transition-colors"
            />
          </div>
        </div>

        {/* 3. Results Display */}
        <div className="space-y-12 pt-4">
          {resultsBlocks.map((block, blockIndex) => {
            const grandChamp = block[0];
            const subChamps = block.slice(1);

            return (
              <div key={blockIndex} className="space-y-6">
                
                {/* Grand Champion Card */}
                {grandChamp && (
                  <div className="relative bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#d4af37]/40 rounded-lg p-6 md:p-10 flex justify-between items-center overflow-hidden group">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#d4af37] opacity-60 m-2"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#d4af37] opacity-60 m-2"></div>
                    
                    <div>
                      <h2 className="text-[#d4af37] text-2xl md:text-3xl font-serif whitespace-pre-line leading-snug">
                        {grandChamp.title}
                      </h2>
                      {grandChamp.rank && <p className="text-sm text-gray-400 mt-2">{grandChamp.rank}</p>}
                    </div>
                    <div>
                      <span className="text-5xl md:text-7xl font-serif text-[#f2e3c6] tracking-widest drop-shadow-lg">
                        {grandChamp.id}
                      </span>
                    </div>
                  </div>
                )}

                {/* Sub Division Cards */}
                {subChamps.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {subChamps.map((item, idx) => (
                      <div key={idx} className="relative bg-[#111] border border-[#222] hover:border-[#d4af37]/30 transition-all duration-300 rounded-lg p-6 flex flex-col justify-between aspect-[4/5] group">
                         {/* Corner accents for sub cards */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gray-600 group-hover:border-[#d4af37] opacity-50 m-2 transition-colors"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gray-600 group-hover:border-[#d4af37] opacity-50 m-2 transition-colors"></div>
                        
                        <div>
                          <h3 className="text-sm font-semibold text-gray-200 whitespace-pre-line leading-relaxed">
                            {item.title}
                          </h3>
                          {item.rank && <p className="text-xs text-gray-500 mt-2">{item.rank}</p>}
                        </div>
                        <div className="mt-6">
                          <span className="text-4xl font-serif text-white tracking-widest group-hover:text-[#f2e3c6] transition-colors">
                            {item.id}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}