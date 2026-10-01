'use client';

import { useState, useEffect, useMemo } from 'react';
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// โครงสร้างข้อมูล (Interface)
interface ChampionData {
  title: string;
  id: string;
  isGrandChampion?: boolean;
}

interface RankResult {
  rank: number;
  id: string;
  name: string;
}

interface ClassData {
  classId: string;
  className: string;
  results: RankResult[];
}

interface DivisionData {
  divisionId: string;
  divisionName: string;
  subTitle: string;
  classes: ClassData[];
}

interface RawResultItem {
  title: string;
  id: string;
  rank: string;
}

interface RawChampionItem {
  title: string;
  id: string;
  name: string;
  className: string;
}

interface ChampionData {
  title: string;
  id: string;
  name: string;
  className: string;
  isGrandChampion?: boolean;
}

export default function CompleteResultsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. เปลี่ยนจาก Mock Data มาเป็น State รอรับข้อมูลจริง
  const [championsData, setChampionsData] = useState<ChampionData[]>([]);
  const [divisionData, setDivisionData] = useState<DivisionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const GOOGLE_APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || '';

  // 2. ฟังก์ชันดึงและแปลงข้อมูล (Data Transformation)
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/results');
        const resultJson = await response.json();
        
        if (resultJson.status === "success" && resultJson.data) {
          const rawClasses = resultJson.data.classes || [];
          const rawChampions = resultJson.data.champions || [];

          // 1. แปลงข้อมูลแชมป์ (ดึงจากคอลัมน์ G, H, I)
          const newChampions: ChampionData[] = rawChampions.map((item: RawChampionItem) => ({
            title: item.title,
            id: item.id !== "-" ? item.id : "",
            name: item.name !== "-" ? item.name : "",
            className: item.className !== "-" ? item.className : "",
            isGrandChampion: item.title.toLowerCase().includes('grand') || item.title.includes('Grand')
          }));

          // 2. แปลงข้อมูลคลาส 1-5 (ดึงจากคอลัมน์ A-E)
          const divMap: Record<string, DivisionData> = {};
          rawClasses.forEach((block: RawResultItem[]) => {
            if (!block || block.length === 0) return;

            const classIdRaw = block[0].title;
            const classId = classIdRaw.split('-')[0]; 
            const divLetter = classId.charAt(0).toUpperCase(); 
            const divId = `div-${divLetter.toLowerCase()}`;

            if (!divMap[divId]) {
              divMap[divId] = {
                divisionId: divId,
                divisionName: `DIVISION ${divLetter}`,
                subTitle: "",
                classes: []
              };
            }

            divMap[divId].classes.push({
              classId: classId,
              className: `Class ${classId}`,
              results: block.map((item, idx) => ({
                rank: idx + 1,
                id: item.id !== "-" ? item.id : "",
                name: item.rank !== "-" && item.rank !== "" ? item.rank : "รอผล"
              }))
            });
          });

          setChampionsData(newChampions);
          setDivisionData(Object.values(divMap));
        }
      } catch (error) {
        console.error('Error fetching data from Google Sheets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, []);

  const scrollToDivision = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const filteredChampions = useMemo(() => {
    if (!searchQuery) return championsData;
    return championsData.filter(c => 
      c.id.includes(searchQuery) || c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, championsData]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return divisionData;
    return divisionData.map(div => {
      const filteredClasses = div.classes.map(cls => {
        const filteredResults = cls.results.filter(r => 
          r.id.includes(searchQuery) || r.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { ...cls, results: filteredResults };
      }).filter(cls => cls.results.length > 0);
      return { ...div, classes: filteredClasses };
    }).filter(div => div.classes.length > 0);
  }, [searchQuery, divisionData]);

  const getRankStyle = (rank: number) => {
    switch(rank) {
      case 1: return { border: "border-[#d4af37]/60", text: "text-[#d4af37]", bgHover: "hover:border-[#d4af37]" };
      case 2: return { border: "border-gray-400/50", text: "text-gray-300", bgHover: "hover:border-gray-300" };
      case 3: return { border: "border-[#b87333]/50", text: "text-[#b87333]", bgHover: "hover:border-[#b87333]" };
      default: return { border: "border-[#222]", text: "text-gray-500", bgHover: "hover:border-gray-500" };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090909] text-[#d4af37] flex items-center justify-center font-serif text-2xl animate-pulse">
        กำลังโหลดผลประกาศ...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] text-gray-300 font-sans pb-32">
      
      {/* 1. Navbar / Scroll Menu */}
      <div className="sticky top-0 z-50 bg-[#090909]/95 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => scrollToDivision('top')}
              className="whitespace-nowrap px-6 md:px-10 py-5 text-sm transition-all text-[#d4af37] font-medium border-b-[3px] border-[#d4af37] bg-gradient-to-t from-[#d4af37]/10 to-transparent"
            >
              รางวัลแชมป์
            </button>
            {divisionData.map((div) => (
              <button
                key={div.divisionId}
                onClick={() => scrollToDivision(div.divisionId)}
                className="whitespace-nowrap px-6 md:px-10 py-5 text-sm transition-all text-gray-400 hover:text-white border-b-[3px] border-transparent hover:border-[#d4af37]"
              >
                {div.divisionName}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8">
        
        {/* 2. ช่องค้นหา */}
        <div className="space-y-3 mb-10" id="top">
          <div className="flex justify-between items-end text-xs md:text-sm text-gray-400">
            <label>ค้นหาผลรางวัล</label>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-md focus-within:border-[#d4af37]/50 transition-colors">
            <input 
              type="text" 
              placeholder="ค้นหาเลขโหล หรือชื่อผู้สมัคร เช่น 0012"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-gray-200 rounded-md px-5 py-4 focus:outline-none placeholder-gray-600 text-sm md:text-base"
            />
          </div>
        </div>

        {/* 3. ส่วนรางวัลแชมป์ */}
        {(filteredChampions.length > 0) && (
          <div className="flex flex-col space-y-6 mb-20">
            
            {/* Grand Champion */}
            {filteredChampions.filter(d => d.isGrandChampion).map((grand, idx) => {

              return (
                <div 
                  key={`grand-${idx}`} 
                  className="relative bg-[#151515] border border-[#d4af37]/50 rounded-md p-6 md:p-12 flex justify-between items-center overflow-hidden hover:border-[#d4af37]/90 transition-colors duration-700 group shadow-[0_0_30px_rgba(212,175,55,0.05)]"
                >
                  <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #333 10px, #333 11px)' }}>
                  </div>
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent animate-shine-slow"></div>
                  </div>

                  <div className="absolute top-4 left-4 w-4 h-4 md:w-8 md:h-8 border-t-[1px] border-l-[1px] border-[#d4af37] opacity-80 z-10"></div>
                  <div className="absolute bottom-4 right-4 w-4 h-4 md:w-8 md:h-8 border-b-[1px] border-r-[1px] border-[#d4af37] opacity-80 z-10"></div>
                  
                  <div className="ml-2 md:ml-4 z-10 flex flex-col gap-1 md:gap-2">
                    {/* ดึงชื่อรางวัล (เช่น Grand Champion) */}
                    <h2 className="text-[#d4af37] text-xl md:text-3xl font-bold tracking-wide">{grand.title}</h2>
                    {/* ดึงชื่อผู้สมัคร (จากคอลัมน์ H) */}
                    <p className="text-gray-200 text-sm md:text-xl font-medium">{grand.name}</p>
                    {/* ดึงกลุ่มคลาส (จากคอลัมน์ I) */}
                    <p className="text-gray-500 text-xs md:text-sm">{grand.className}</p>
                  </div>
                  <div className="mr-2 md:mr-4 z-10">
                    <span className={`text-6xl md:text-[100px] ${playfair?.className || ''} text-[#f2e3c6] tracking-widest drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]`}>
                      {/* ดึงรหัสโหล (จากคอลัมน์ G) */}
                      {grand.id}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Division Champions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 pt-2">
              {filteredChampions.filter(d => !d.isGrandChampion).map((item, idx) => {
                return (
                  <div 
                    key={idx} 
                    className="relative bg-[#151515] border border-[#333] rounded-md p-5 md:p-6 flex flex-col aspect-[3/3.8] group hover:border-[#555] transition-all duration-300 cursor-default overflow-hidden"
                  >
                     <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
                      style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, #444 8px, #444 9px)' }}>
                    </div>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                      <div className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shine"
                        style={{ animationDelay: `${idx * 0.3}s` }}></div>
                    </div>

                    <div className="absolute top-3 left-3 w-3 h-3 border-t-[1px] border-l-[1px] border-gray-500/60 group-hover:border-[#d4af37]/70 transition-colors duration-300 z-10"></div>
                    <div className="absolute bottom-3 right-3 w-3 h-3 border-b-[1px] border-r-[1px] border-gray-500/60 group-hover:border-[#d4af37]/70 transition-colors duration-300 z-10"></div>
                    
                    <div className="z-10 flex flex-col h-full">
                      {/* ดึงชื่อรางวัล (เช่น Division Champion A) */}
                      <h3 className="text-xs md:text-[14px] font-semibold text-gray-200">{item.title}</h3>
                      <div className="mt-4 md:mt-6">
                        <span className={`text-5xl md:text-6xl ${playfair?.className || ''} text-white tracking-widest group-hover:text-[#f2e3c6] transition-colors drop-shadow-sm block`}>
                          {/* ดึงรหัสโหล */}
                          {item.id}
                        </span>
                        {/* ดึงชื่อผู้สมัคร */}
                        <p className="text-sm md:text-base text-gray-300 mt-2 md:mt-4 font-medium">{item.name}</p>
                      </div>
                      <div className="mt-auto border-t border-[#333] pt-3">
                        {/* ดึงกลุ่มคลาสไปแสดงด้านล่างสุด */}
                        <p className="text-[10px] md:text-[11px] text-gray-500 font-semibold tracking-wider">{item.className}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. หัวข้อ Class Placements */}
        {filteredData.length > 0 && (
          <div className="mb-8">
            <h1 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Class Placements</h1>
            <h2 className="text-xl md:text-2xl font-medium text-white">ผลอันดับ 1-5 รายคลาส</h2>
          </div>
        )}

        {/* 5. รายชื่ออันดับ 1-5 */}
        <div className="space-y-16">
          {filteredData.map((division) => (
            <div key={division.divisionId} id={division.divisionId} className="scroll-mt-32">
              <div className="flex justify-between items-end border-b border-[#222] pb-3 mb-6">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-[#d4af37] font-semibold tracking-wider text-lg">
                    {division.divisionName}
                  </h3>
                </div>
              </div>

              <div className="space-y-10">
                {division.classes.map((cls) => (
                  <div key={cls.classId}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[#d4af37] font-bold text-lg">{cls.classId}</span>
                      <span className="text-sm text-gray-300">{cls.className}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {cls.results.map((item) => {
                        const style = getRankStyle(item.rank);
                        return (
                          <div key={item.id + item.rank} className={`relative bg-gradient-to-br from-[#121212] to-[#0a0a0a] border-[1px] ${style.border} ${style.bgHover} rounded-md p-4 flex flex-col justify-between aspect-[4/3] transition-colors duration-300 group`}>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-1.5 opacity-80">
                                {item.rank === 1 && <span className="text-[#d4af37] text-xs">👑</span>}
                                {item.rank === 2 && <span className="text-gray-300 text-xs">🥈</span>}
                                {item.rank === 3 && <span className="text-[#b87333] text-xs">🥉</span>}
                                <span className={`text-[10px] uppercase tracking-wider ${style.text}`}>Rank {item.rank}</span>
                              </div>
                              <div className="text-right">
                                <span className={`text-xl md:text-2xl ${playfair?.className || ''} ${style.text}`}>{item.rank}</span>
                                <p className="text-[8px] text-gray-600 uppercase mt-0.5">Place</p>
                              </div>
                            </div>
                            
                            <div className="my-3">
                              <span className={`text-2xl md:text-3xl ${playfair?.className || ''} text-white tracking-widest drop-shadow-sm group-hover:text-gray-100 transition-colors`}>
                                {item.id}
                              </span>
                            </div>

                            <div className="border-t border-[#333] pt-2 mt-auto">
                              <p className="text-[10px] md:text-xs text-gray-400 truncate w-full" title={item.name}>
                                {item.name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}