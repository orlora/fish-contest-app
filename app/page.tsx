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
  name?: string;
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
  
  // 1. รอรับข้อมูลจริง
  const [championsData, setChampionsData] = useState<ChampionData[]>([]);
  const [divisionData, setDivisionData] = useState<DivisionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('champions');
  const [totalResultsCount, setTotalResultsCount] = useState<number>(0);

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
          
          setTotalResultsCount(resultJson.data.totalCount || 0);

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
              results: block.map((item: RawResultItem, idx: number) => {
                const validName = item.name || "";
                
                return {
                  rank: idx + 1,
                  id: item.id !== "-" ? item.id : "",
                  name: validName !== "-" && validName !== "" ? validName : "ไม่มีชื่อผู้สมัคร"
                };
              })
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

  useEffect(() => {
    const handleScroll = () => {
      // รวม ID ของทุกโซน ('top' คือรางวัลแชมป์)
      const sectionIds = ['top', ...divisionData.map(d => d.divisionId)];
      let currentVisibleSection = 'top';

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          
          // เช็คว่าตำแหน่ง Navbar (ประมาณ 250px จากขอบจอ) กำลังพาดผ่านโซนนี้อยู่หรือไม่
          if (rect.top <= 250 && rect.bottom > 250) {
            currentVisibleSection = id;
            break; // เมื่อเจอโซนที่ใช่แล้ว ให้หยุดลูปทันที
          }
        }
      }

      // ดักเคสพิเศษ: ถ้าเลื่อนกลับไปบนสุดของหน้าเว็บ ล็อคเป็นรางวัลแชมป์เสมอ
      if (window.scrollY < 100) {
        currentVisibleSection = 'top';
      }

      // อัปเดต State ถ้าโซนเปลี่ยน
      setActiveTab((prev) => {
        if (prev !== currentVisibleSection) return currentVisibleSection;
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // หน่วงเวลา 0.5 วินาที เพื่อรอให้ข้อมูลที่ยาวมากๆ ก่อตัวและเรนเดอร์ลง DOM ให้เสร็จก่อน
    const timer = setTimeout(handleScroll, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [divisionData]);

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
      case 1: 
        return { 
          border: "border-[#d4af37]/50", // ขอบนอกเป็นสีทองโปร่งแสง
          // 🟢 เงาเรืองแสงด้านนอก + ขอบสว่างด้านบน 2px
          shadow: "shadow-[0_0_15px_rgba(212,175,55,0.15),inset_0_2px_0_0_#d4af37]",
          text: "text-[#e8c766]", 
          bg: "bg-gradient-to-b from-[#3a2f18] to-[#121212]", // พื้นหลังสว่างขึ้น
          line: "border-[#d4af37]/40",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"></path>
            </svg>
          )
        };
      case 2: 
        return { 
          border: "border-[#94a3b8]/50", 
          shadow: "shadow-[0_0_15px_rgba(148,163,184,0.15),inset_0_2px_0_0_#94a3b8]",
          text: "text-[#b4c4d9]", 
          bg: "bg-gradient-to-b from-[#242b38] to-[#121212]", 
          line: "border-[#94a3b8]/40",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          )
        };
      case 3: 
        return { 
          border: "border-[#b87333]/50", 
          shadow: "shadow-[0_0_15px_rgba(184,115,51,0.15),inset_0_2px_0_0_#b87333]",
          text: "text-[#df9466]", 
          bg: "bg-gradient-to-b from-[#3d2416] to-[#121212]", 
          line: "border-[#b87333]/40",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          )
        };
      default: // อันดับ 4-5
        return { 
          border: "border-[#52525b]/50", 
          shadow: "shadow-[0_0_15px_rgba(82,82,91,0.15),inset_0_2px_0_0_#52525b]",
          text: "text-[#a2aab5]", 
          bg: "bg-gradient-to-b from-[#27272a] to-[#121212]", 
          line: "border-[#52525b]/40",
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          )
        };
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

      {/* Header Title */}
        <div className="relative mb-30 mt-30">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-[#d4af37] tracking-wider relative z-10">
            Competition Results
          </h1>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#d4af37]/10 rotate-45 -z-0 pointer-events-none"></div>
        </div>

      {/* 1. Navbar / Scroll Menu */}
      <div className="z-50 bg-[#090909]/95 backdrop-blur-md border-[#222] py-3 md:py-4">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          
          {/* กล่องพื้นหลังสำหรับปุ่ม Tabs */}
          <div className="flex overflow-x-auto bg-[#151515] rounded-md p-1 border border-[#222] scrollbar-hide">
            
            {/* ปุ่มรางวัลแชมป์ (ไม่มี hover) */}
            <button 
              onClick={() => scrollToDivision('top')}
              className="whitespace-nowrap flex-1 min-w-[120px] text-center py-3 px-4 rounded text-sm md:text-base font-medium bg-[#2a261b] text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.08)] border border-[#d4af37]/20"
            >
              รางวัลแชมป์
            </button>
            
            {/* ปุ่ม Division */}
            {divisionData.map((div) => (
              <button
                key={div.divisionId}
                onClick={() => scrollToDivision(div.divisionId)}
                className="whitespace-nowrap flex-1 min-w-[120px] text-center py-3 px-4 rounded text-sm md:text-base font-medium text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200 transition-colors duration-300"
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
            <span className="text-gray-400 text-xs md:text-sm">
              {totalResultsCount} ผลประกาศ
            </span>
          </div>
          <div className="bg-[#111] border border-[#222] rounded-md focus-within:border-[#d4af37]/50 transition-colors">
            <input 
              type="text" 
              placeholder="ค้นหาเลขโหล หรือชื่อผู้สมัคร เช่น A001"
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
                  className="relative bg-[#151515] border-2 border-[#d4af37]/60 rounded-md p-6 md:p-12 flex justify-between items-center overflow-hidden shadow-[0_0_15px_rgba(212,175,55,0.2),inset_0_0_20px_rgba(212,175,55,0.05)]"
                >
                  <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #333 10px, #333 11px)' }}>
                  </div>
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent animate-shine-slow"></div>
                  </div>

                  <div className="absolute top-4 left-4 w-4 h-4 md:w-8 md:h-8 border-t-[2px] border-l-[2px] border-[#d4af37] opacity-80 z-10"></div>
                  <div className="absolute bottom-4 right-4 w-4 h-4 md:w-8 md:h-8 border-b-[2px] border-r-[2px] border-[#d4af37] opacity-80 z-10"></div>
                  
                  <div className="ml-2 md:ml-4 z-10 flex flex-col gap-1 md:gap-2">
                    {/* ดึงชื่อรางวัล (เช่น Grand Champion) */}
                    <h2 className="text-[#d4af37] text-xl md:text-3xl font-bold tracking-wide">{grand.title}</h2>
                    {/* ดึงชื่อผู้สมัคร (จากคอลัมน์ H) */}
                    <p className="text-gray-200 text-sm md:text-xl font-medium">{grand.name}</p>
                    {/* ดึงกลุ่มคลาส (จากคอลัมน์ I) */}
                    <p className="text-gray-500 text-xs md:text-sm">{grand.className}</p>
                  </div>
                  <div className="mr-2 md:mr-4 z-10">
                    <span className="text-6xl md:text-[100px] ${playfair.className} text-[#f2e3c6] tracking-widest drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
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
                    className="relative bg-[#151515] border border-white/50 rounded-md p-5 md:p-6 flex flex-col aspect-[3/3.2] cursor-default overflow-hidden"
                  >
                    <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
                      style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 8px, #444 8px, #444 9px)' }}>
                    </div>
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                      <div className="absolute top-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shine"
                        style={{ animationDelay: `${idx * 0.3}s` }}></div>
                    </div>

                    {/* 🟢 ถ้าอยากให้มุมตัว L เป็นสีขาวด้วย ให้เปลี่ยนเป็น border-white */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-[1px] border-l-[1px] border-gray-200/80 z-10"></div>
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-[1px] border-r-[1px] border-gray-200/80 z-10"></div>
                    
                    <div className="z-10 flex flex-col h-full">
                      <h3 className="text-xs md:text-[14px] font-semibold text-gray-200">{item.title}</h3>
                      <div className="mt-4 md:mt-6">
                        <span className="text-5xl md:text-6xl ${playfair.className} text-white tracking-widest drop-shadow-sm block">
                          {item.id}
                        </span>
                        <p className="text-sm md:text-base text-gray-300 mt-2 md:mt-4 font-medium">{item.name}</p>
                      </div>
                      <div className="mt-auto border-t border-[#333] pt-3">
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
                          <div 
                            key={item.id + item.rank} 
                            // 🟢 ปรับ padding ด้านล่าง (pb-3 md:pb-4) ให้ฐานกล่องหนาขึ้น ชื่อจะได้ขยับลอยขึ้นมา
                            className={`relative ${style.bg} border-[1px] ${style.border} ${style.shadow} rounded-lg px-4 pt-4 pb-3 md:px-5 md:pt-5 md:pb-4 flex flex-col justify-between aspect-[4/3.5] cursor-default`}
                          >
                            <div className="flex justify-between items-start">
                              <div className={`flex items-center gap-2 opacity-95 mt-1.5 md:mt-2 ${style.text}`}>
                                {style.icon}
                                <span className="text-[15px] md:text-[17px] font-bold tracking-wider">Rank {item.rank}</span>
                              </div>
                              <div className="text-right flex flex-col items-center">
                                <span className={`text-[32px] md:text-[40px] ${playfair.className} ${style.text} leading-[0.8]`}>{item.rank}</span>
                                <p className={`text-[7.5px] md:text-[8.5px] font-bold tracking-widest uppercase mt-2 ${style.text}`}>Place</p>
                              </div>
                            </div>
                            
                            <div className="my-auto pt-4 pb-2">
                              <span className={`text-[34px] sm:text-4xl md:text-[42px] ${playfair.className} text-white tracking-widest drop-shadow-sm`}>
                                {item.id}
                              </span>
                            </div>

                            {/* 🟢 ลด pt (padding-top) ของเส้นคั่น เพื่อให้ชื่อชิดเส้นมากขึ้น และมีพื้นที่ด้านล่างเพิ่มขึ้น */}
                            <div className={`border-t-[1px] ${style.line} pt-2.5 md:pt-3 mt-auto`}>
                              <p className="text-[12px] md:text-[14px] text-gray-300 font-medium truncate w-full" title={item.name}>
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