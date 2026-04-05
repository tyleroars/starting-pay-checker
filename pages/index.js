import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';

const CATEGORIES = [
  'All fields','Admin & Office','Agriculture','Business & Finance',
  'Construction & Trades','Creative & Media','Education','Engineering',
  'Food & Hospitality','Healthcare','Healthcare Support','Legal',
  'Maintenance & Grounds','Maintenance & Repair','Personal Care',
  'Production & Manufacturing','Protective Services','Sales',
  'Science & Research','Social & Nonprofit','Tech','Transportation & Logistics',
];

const MIN_PAY_OPTIONS = [
  { label: 'Any', value: 0 },
  { label: '$30K+', value: 30000 },
  { label: '$40K+', value: 40000 },
  { label: '$50K+', value: 50000 },
  { label: '$60K+', value: 60000 },
  { label: '$70K+', value: 70000 },
  { label: '$80K+', value: 80000 },
];

// Education filter options — each filters to exactly that level
const EDUC_FILTERS = [
  { label: 'Any education', value: 'all' },
  { label: 'No degree', value: 'nodegree' },
  { label: "Associate's", value: 'associates' },
  { label: "Bachelor's", value: 'bachelors' },
  { label: "Master's", value: 'masters' },
  { label: 'Doctoral', value: 'doctoral' },
];

const EDUC_STYLE = {
  "No degree":    { bg: '#E8F5ED', color: '#1A5C32' },
  "HS diploma":   { bg: '#E8F5ED', color: '#1A5C32' },
  "Certificate":  { bg: '#E8F5ED', color: '#1A5C32' },
  "Associate's":  { bg: '#EEF4FF', color: '#1B3A4B' },
  "Bachelor's":   { bg: '#EEF4FF', color: '#1B3A4B' },
  "Master's":     { bg: '#FEF3E2', color: '#854F0B' },
  "Doctoral":     { bg: '#FDEAEA', color: '#8B2020' },
};

// Map filter value to education strings in the data
const EDUC_FILTER_MAP = {
  nodegree:   (o) => o.nodegree === true,
  associates: (o) => o.education === "Associate's",
  bachelors:  (o) => o.education === "Bachelor's",
  masters:    (o) => o.education === "Master's",
  doctoral:   (o) => o.education === "Doctoral",
};

function fmt(n) {
  if (!n || n <= 0) return 'N/A';
  return '$' + Math.round(n / 1000) + 'K';
}

function fmtFull(n) {
  if (!n || n <= 0) return 'N/A';
  return '$' + n.toLocaleString();
}

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All fields');
  const [minPay, setMinPay] = useState(0);
  const [educFilter, setEducFilter] = useState('all');
  const [expandedCode, setExpandedCode] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 40;

  useEffect(() => {
    fetch('/api/occupations')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load data.'); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!data?.occupations) return [];
    const q = search.toLowerCase().trim();
    const educFn = EDUC_FILTER_MAP[educFilter];
    return data.occupations.filter(o => {
      if (category !== 'All fields' && o.category !== category) return false;
      if (o.entryPay < minPay) return false;
      if (educFn && !educFn(o)) return false;
      if (q && !o.title.toLowerCase().includes(q) && !o.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, category, minPay, educFilter]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = filtered.length > paginated.length;
  const resetPage = useCallback(() => { setPage(1); setExpandedCode(null); }, []);

  const chip = (active) => ({
    fontSize: 13, fontWeight: 500, fontFamily: 'Inter,sans-serif',
    padding: '6px 14px', borderRadius: 8, lineHeight: 1,
    border: active ? '1px solid #1B3A4B' : '1px solid #E4E0D6',
    background: active ? '#1B3A4B' : '#fff',
    color: active ? '#fff' : '#4A4A4A',
    cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
    transition: 'all 0.1s',
  });

  const selectStyle = {
    fontSize: 13, fontFamily: 'Inter,sans-serif',
    padding: '0 28px 0 12px', height: 40,
    borderRadius: 8, border: '1px solid #E4E0D6',
    background: '#fff', color: '#1A1A1A', cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  };

  return (
    <>
      <Head>
        <title>Starting Pay Checker — GradSimple</title>
        <meta name="description" content="Real entry-level salary data for hundreds of career paths. Powered by BLS data. Built for students and early-career professionals." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{font-size:16px;scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;background:#FAF9F5;color:#4A4A4A;min-height:100vh;line-height:1.75;-webkit-font-smoothing:antialiased}
        ::placeholder{color:#9E9E9A}
        input:focus,select:focus{outline:none;border-color:#1B3A4B !important}
        a{color:#1B3A4B}
      `}</style>

      {/* Navbar */}
      <nav style={{background:'#fff',borderBottom:'0.5px solid #E4E0D6',padding:'0 24px',height:56,display:'flex',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <a href="https://gradsimple.com" style={{display:'flex',alignItems:'center',gap:9,textDecoration:'none'}}>
          <div style={{width:32,height:32,background:'#1B3A4B',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'#fff',fontSize:13,fontWeight:700,letterSpacing:'-0.5px'}}>GS</span>
          </div>
          <span style={{fontSize:15,fontWeight:700,color:'#1A1A1A',letterSpacing:'-0.3px'}}>GradSimple</span>
          <span style={{fontSize:11,fontWeight:600,color:'#6B6B6B',letterSpacing:'0.08em',textTransform:'uppercase',marginLeft:2}}>Career Intelligence</span>
        </a>
      </nav>

      {/* Insiders banner */}
      <div style={{background:'#0D1F2D',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'center',gap:16,flexWrap:'wrap'}}>
        <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',lineHeight:1.5,textAlign:'center'}}>
          Salary is one piece. Want to know which fields are actually hiring right now?
        </p>
        <a href="https://gradsimple.com/gradsimple-insiders/"
          style={{fontSize:13,fontWeight:700,color:'#fff',background:'#FF8400',padding:'7px 16px',borderRadius:8,textDecoration:'none',whiteSpace:'nowrap',flexShrink:0}}>
          See GradSimple Insiders →
        </a>
      </div>

      <div style={{maxWidth:860,margin:'0 auto',padding:'40px 20px 80px'}}>

        {/* Hero */}
        <div style={{marginBottom:36}}>
          <p style={{fontSize:11,fontWeight:600,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.14em',marginBottom:12}}>Starting Pay Checker</p>
          <h1 style={{fontSize:'clamp(26px,5vw,38px)',fontWeight:800,color:'#1A1A1A',letterSpacing:'-1px',lineHeight:1.1,marginBottom:12}}>
            What will you actually make<br/><span style={{color:'#1B3A4B'}}>starting out?</span>
          </h1>
          <p style={{fontSize:15,color:'#6B6B6B',maxWidth:520,lineHeight:1.65}}>
            Real entry-level salary data for {data ? data.count.toLocaleString() : '...'} occupations, sourced directly from the Bureau of Labor Statistics.
          </p>
        </div>

        {/* Filters */}
        <div style={{marginBottom:24}}>

          {/* Search + min pay */}
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
            <div style={{position:'relative',flex:1,minWidth:200}}>
              <svg style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:15,height:15,stroke:'#9E9E9A',fill:'none',pointerEvents:'none'}} viewBox="0 0 16 16" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
              </svg>
              <input type="text" value={search} onChange={e=>{setSearch(e.target.value);resetPage();}} placeholder="Search any job title..."
                style={{width:'100%',fontSize:14,fontFamily:'Inter,sans-serif',padding:'0 14px 0 38px',height:40,borderRadius:8,border:'1px solid #E4E0D6',background:'#fff',color:'#1A1A1A'}}/>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap'}}>
              <label style={{fontSize:13,fontWeight:500,color:'#4A4A4A'}}>Min pay</label>
              <select value={minPay} onChange={e=>{setMinPay(Number(e.target.value));resetPage();}} style={selectStyle}>
                {MIN_PAY_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Field chips */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>Field</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>{setCategory(cat);resetPage();}} style={chip(category===cat)}>{cat}</button>
              ))}
            </div>
          </div>

          {/* Education chips */}
          <div>
            <div style={{fontSize:11,fontWeight:600,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:8}}>Education required</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {EDUC_FILTERS.map(f=>(
                <button key={f.value} onClick={()=>{setEducFilter(f.value);resetPage();}} style={chip(educFilter===f.value)}>{f.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div style={{fontSize:13,color:'#6B6B6B',marginBottom:12}}>
          {loading ? 'Loading...' : `${filtered.length.toLocaleString()} occupation${filtered.length!==1?'s':''} found`}
        </div>

        {error && (
          <div style={{background:'#FDEAEA',border:'1px solid #F0B8B8',borderRadius:8,padding:'16px 20px',color:'#8B2020',fontSize:14}}>{error}</div>
        )}

        {loading && (
          <div style={{textAlign:'center',padding:'48px 0',color:'#6B6B6B',fontSize:14}}>Loading occupation data...</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{textAlign:'center',padding:'48px 0'}}>
            <div style={{fontSize:16,fontWeight:600,color:'#4A4A4A',marginBottom:6}}>No occupations found</div>
            <div style={{fontSize:14,color:'#6B6B6B'}}>Try adjusting your filters or clearing your search.</div>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && paginated.map(occ => {
          const isOpen = expandedCode === occ.code;
          const educStyle = EDUC_STYLE[occ.education] || { bg: '#F0EDE4', color: '#6B6B6B' };

          return (
            <div key={occ.code} onClick={()=>setExpandedCode(prev=>prev===occ.code?null:occ.code)}
              style={{background:'#fff',border:isOpen?'1px solid #1B3A4B':'1px solid #E4E0D6',borderRadius:12,marginBottom:8,cursor:'pointer',overflow:'hidden',transition:'border-color 0.12s'}}>

              <div style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:'#1A1A1A',letterSpacing:'-0.2px',marginBottom:6}}>{occ.title}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    <span style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:6,background:'#E8EFF5',color:'#1B3A4B'}}>{occ.category}</span>
                    {occ.education && (
                      <span style={{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:6,background:educStyle.bg,color:educStyle.color}}>{occ.education}</span>
                    )}
                    {occ.license && (
                      <span style={{fontSize:11,fontWeight:500,padding:'3px 9px',borderRadius:6,background:'#FEF3E2',color:'#854F0B'}}>{occ.license}</span>
                    )}
                    {occ.nodegree && (
                      <span style={{fontSize:11,fontWeight:500,padding:'3px 9px',borderRadius:6,background:'#E8F5ED',color:'#1A5C32'}}>No degree req.</span>
                    )}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontSize:10,fontWeight:600,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:3}}>Starting pay</div>
                  <div style={{fontSize:24,fontWeight:800,color:'#1A1A1A',letterSpacing:'-1px',fontVariantNumeric:'tabular-nums'}}>{fmt(occ.entryPay)}</div>
                </div>
                <div style={{fontSize:14,color:'#6B6B6B',flexShrink:0,transition:'transform 0.2s',transform:isOpen?'rotate(180deg)':'none'}}>↓</div>
              </div>

              {isOpen && (
                <div style={{borderTop:'1px solid #E4E0D6',padding:'20px 20px 22px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                    <div>
                      <div style={{fontSize:10,fontWeight:600,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:12}}>Pay range</div>
                      <div style={{border:'1px solid #E4E0D6',borderRadius:8,overflow:'hidden'}}>
                        {[
                          {label:'Bottom 25% (entry)',val:occ.entryPay,featured:true},
                          {label:'Median',val:occ.median,featured:false},
                          {label:'Top 25%',val:occ.p75,featured:false},
                        ].map(row=>(
                          <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderBottom:row.label!=='Top 25%'?'1px solid #E4E0D6':'none',background:row.featured?'#F0EDE4':'#fff'}}>
                            <span style={{fontSize:13,color:row.featured?'#1A1A1A':'#4A4A4A',fontWeight:row.featured?600:400}}>{row.label}</span>
                            <span style={{fontSize:row.featured?15:13,fontWeight:row.featured?700:500,color:row.featured?'#1B3A4B':'#6B6B6B',fontVariantNumeric:'tabular-nums'}}>{fmtFull(row.val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:10,fontWeight:600,color:'#6B6B6B',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:12}}>Role info</div>
                      <div style={{border:'1px solid #E4E0D6',borderRadius:8,overflow:'hidden'}}>
                        {[
                          {label:'Typical education',val:occ.education||'Not specified'},
                          {label:'License / cert',val:occ.license||'None required'},
                          {label:'Total employed',val:occ.employment?occ.employment.toLocaleString():'N/A'},
                        ].map((row,i,arr)=>(
                          <div key={row.label} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'9px 14px',borderBottom:i<arr.length-1?'1px solid #E4E0D6':'none'}}>
                            <span style={{fontSize:13,color:'#6B6B6B'}}>{row.label}</span>
                            <span style={{fontSize:13,color:'#1A1A1A',fontWeight:500,textAlign:'right',maxWidth:'55%'}}>{row.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {hasMore && !loading && (
          <div style={{textAlign:'center',marginTop:20}}>
            <button onClick={()=>setPage(p=>p+1)}
              style={{fontSize:14,fontWeight:600,fontFamily:'Inter,sans-serif',padding:'12px 28px',borderRadius:8,border:'1px solid #1B3A4B',background:'#fff',color:'#1B3A4B',cursor:'pointer'}}>
              Show more ({filtered.length-paginated.length} remaining)
            </button>
          </div>
        )}

        {/* CTA */}
        <div style={{marginTop:48,background:'#1B3A4B',borderRadius:12,padding:'32px 36px'}}>
          <p style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.14em',color:'rgba(255,255,255,0.5)',marginBottom:10}}>GradSimple Insiders · $12/month</p>
          <h2 style={{fontSize:22,fontWeight:700,color:'#fff',letterSpacing:'-0.3px',marginBottom:10,lineHeight:1.3}}>Salary is one data point.<br/>What about everything else?</h2>
          <p style={{fontSize:14,color:'rgba(255,255,255,0.7)',lineHeight:1.65,marginBottom:20,maxWidth:480}}>
            Insiders covers which fields are actually adding entry-level roles, which are pulling back, and how AI is reshaping what employers want. Twice a month, in plain English.
          </p>
          <a href="https://gradsimple.com/gradsimple-insiders/" style={{display:'inline-block',fontSize:14,fontWeight:700,color:'#fff',background:'#FF8400',padding:'12px 24px',borderRadius:8,textDecoration:'none'}}>
            See what Insiders gets you →
          </a>
        </div>

        <p style={{marginTop:28,fontSize:12,color:'#6B6B6B',textAlign:'center',lineHeight:1.65}}>
          Data from the Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS) program, May 2024. Entry-level pay reflects the 10th percentile annual wage. All figures are national estimates.
        </p>
      </div>
    </>
  );
}
