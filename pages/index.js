import { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';

const CATEGORIES = [
  'All fields',
  'Admin & Office',
  'Agriculture',
  'Business & Finance',
  'Construction & Trades',
  'Creative & Media',
  'Education',
  'Engineering',
  'Food & Hospitality',
  'Healthcare',
  'Healthcare Support',
  'Legal',
  'Maintenance & Grounds',
  'Maintenance & Repair',
  'Personal Care',
  'Production & Manufacturing',
  'Protective Services',
  'Sales',
  'Science & Research',
  'Social & Nonprofit',
  'Tech',
  'Transportation & Logistics',
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

const EDUCATION_OPTIONS = [
  { label: 'Any education', value: 'all' },
  { label: 'No degree required', value: 'nodegree' },
  { label: "Associate's or less", value: 'associates' },
  { label: "Bachelor's degree", value: 'bachelors' },
  { label: "Master's degree", value: 'masters' },
];

function fmt(n) {
  if (!n || n <= 0) return 'N/A';
  return '$' + Math.round(n / 1000) + 'K';
}

function educCategory(educ) {
  if (!educ) return 'unknown';
  const e = educ.toLowerCase();
  if (e.includes('no formal') || e.includes('high school') || e.includes('postsecondary nondegree')) return 'nodegree';
  if (e.includes("associate")) return 'associates';
  if (e.includes("bachelor")) return 'bachelors';
  if (e.includes("master")) return 'masters';
  return 'unknown';
}

function educLabel(educ) {
  if (!educ) return null;
  const e = educ.toLowerCase();
  if (e.includes('no formal')) return 'No degree';
  if (e.includes('high school')) return 'HS diploma';
  if (e.includes('postsecondary nondegree')) return 'Certificate';
  if (e.includes("associate")) return "Associate's";
  if (e.includes("bachelor")) return "Bachelor's";
  if (e.includes("master")) return "Master's";
  return educ;
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
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load data.'); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!data?.occupations) return [];
    const q = search.toLowerCase().trim();
    return data.occupations.filter(o => {
      if (category !== 'All fields' && o.category !== category) return false;
      if (o.entryPay < minPay) return false;
      if (educFilter !== 'all') {
        const ec = educCategory(o.education);
        if (educFilter === 'nodegree' && ec !== 'nodegree') return false;
        if (educFilter === 'associates' && !['nodegree','associates'].includes(ec)) return false;
        if (educFilter === 'bachelors' && !['nodegree','associates','bachelors'].includes(ec)) return false;
        if (educFilter === 'masters' && ec !== 'masters') return false;
      }
      if (q && !o.title.toLowerCase().includes(q) && !o.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, category, minPay, educFilter]);

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore = filtered.length > paginated.length;

  const resetPage = useCallback(() => setPage(1), []);

  function handleSearchChange(e) { setSearch(e.target.value); resetPage(); }
  function handleCategoryChange(val) { setCategory(val); setExpandedCode(null); resetPage(); }
  function handleMinPayChange(val) { setMinPay(val); resetPage(); }
  function handleEducChange(val) { setEducFilter(val); resetPage(); }

  function toggleExpand(code) {
    setExpandedCode(prev => prev === code ? null : code);
  }

  return (
    <>
      <Head>
        <title>Starting Pay Checker — GradSimple</title>
        <meta name="description" content="Real entry-level salary data for hundreds of career paths. Powered by BLS data. Built for students and early-career professionals." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 16px; scroll-behavior: smooth; }
        body {
          font-family: 'Inter', sans-serif;
          background: #FAF9F5;
          color: #4A4A4A;
          min-height: 100vh;
          line-height: 1.75;
          -webkit-font-smoothing: antialiased;
        }
        a { color: #1B3A4B; text-decoration: underline; }
        a:hover { color: #2A5570; }
        ::placeholder { color: #9E9E9A; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F0EDE4; }
        ::-webkit-scrollbar-thumb { background: #C8C4BB; border-radius: 3px; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        background: '#fff',
        borderBottom: '0.5px solid #E4E0D6',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <a href="https://gradsimple.com" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none' }}>
          <div style={{
            width: 32, height: 32,
            background: '#1B3A4B',
            borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color:'#fff', fontSize:13, fontWeight:700, letterSpacing:'-0.5px' }}>GS</span>
          </div>
          <span style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', letterSpacing:'-0.3px' }}>GradSimple</span>
          <span style={{ fontSize:11, fontWeight:600, color:'#6B6B6B', letterSpacing:'0.08em', textTransform:'uppercase', marginLeft:2 }}>Career Intelligence</span>
        </a>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize:11, fontWeight:600, color:'#6B6B6B', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>
            Starting Pay Checker
          </p>
          <h1 style={{ fontSize:'clamp(28px,5vw,40px)', fontWeight:800, color:'#1A1A1A', letterSpacing:'-1px', lineHeight:1.1, marginBottom:14 }}>
            What will you actually make<br />
            <span style={{ color:'#1B3A4B' }}>starting out?</span>
          </h1>
          <p style={{ fontSize:15, color:'#6B6B6B', maxWidth:520, lineHeight:1.65 }}>
            Real entry-level salary data for {data ? data.count.toLocaleString() : '...'} occupations, sourced directly from the Bureau of Labor Statistics.
          </p>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 28 }}>

          {/* Search + min pay row */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
            <div style={{ position:'relative', flex:1, minWidth:200 }}>
              <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, stroke:'#9E9E9A', fill:'none', pointerEvents:'none' }}
                viewBox="0 0 16 16" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search any job title..."
                style={{
                  width:'100%', fontSize:14, fontFamily:'Inter,sans-serif',
                  padding:'0 14px 0 38px', height:40,
                  borderRadius:8, border:'1px solid #E4E0D6',
                  background:'#fff', color:'#1A1A1A', outline:'none',
                }}
                onFocus={e => e.target.style.borderColor='#1B3A4B'}
                onBlur={e => e.target.style.borderColor='#E4E0D6'}
              />
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
              <label style={{ fontSize:13, fontWeight:500, color:'#4A4A4A' }}>Min pay</label>
              <select
                value={minPay}
                onChange={e => handleMinPayChange(Number(e.target.value))}
                style={{
                  fontSize:13, fontFamily:'Inter,sans-serif',
                  padding:'0 28px 0 12px', height:40,
                  borderRadius:8, border:'1px solid #E4E0D6',
                  background:'#fff', color:'#1A1A1A', cursor:'pointer',
                  appearance:'none',
                  backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat:'no-repeat',
                  backgroundPosition:'right 10px center',
                  outline:'none',
                }}
              >
                {MIN_PAY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
              <label style={{ fontSize:13, fontWeight:500, color:'#4A4A4A' }}>Education</label>
              <select
                value={educFilter}
                onChange={e => handleEducChange(e.target.value)}
                style={{
                  fontSize:13, fontFamily:'Inter,sans-serif',
                  padding:'0 28px 0 12px', height:40,
                  borderRadius:8, border:'1px solid #E4E0D6',
                  background:'#fff', color:'#1A1A1A', cursor:'pointer',
                  appearance:'none',
                  backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B6B6B' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat:'no-repeat',
                  backgroundPosition:'right 10px center',
                  outline:'none',
                }}
              >
                {EDUCATION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category chips */}
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#6B6B6B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>Field</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  style={{
                    fontSize:13, fontWeight:500,
                    padding:'6px 14px',
                    borderRadius:8,
                    border: category === cat ? '1px solid #1B3A4B' : '1px solid #E4E0D6',
                    background: category === cat ? '#1B3A4B' : '#fff',
                    color: category === cat ? '#fff' : '#4A4A4A',
                    cursor:'pointer',
                    whiteSpace:'nowrap',
                    lineHeight:1,
                    fontFamily:'Inter,sans-serif',
                    transition:'all 0.1s',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div style={{ fontSize:13, color:'#6B6B6B', marginBottom:12 }}>
          {loading ? 'Loading...' : `${filtered.length.toLocaleString()} occupation${filtered.length !== 1 ? 's' : ''} found`}
        </div>

        {/* Error state */}
        {error && (
          <div style={{ background:'#FDEAEA', border:'1px solid #F0B8B8', borderRadius:8, padding:'16px 20px', color:'#8B2020', fontSize:14 }}>
            <strong>Data not loaded yet.</strong> Run the GitHub Action to populate data, then refresh.
            <br /><code style={{ fontSize:12, opacity:0.8 }}>{error}</code>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign:'center', padding:'48px 0', color:'#6B6B6B', fontSize:14 }}>
            Loading occupation data...
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 0' }}>
            <div style={{ fontSize:16, fontWeight:600, color:'#4A4A4A', marginBottom:6 }}>No occupations found</div>
            <div style={{ fontSize:14, color:'#6B6B6B' }}>Try adjusting your filters or clearing your search.</div>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && paginated.map(occ => {
          const isOpen = expandedCode === occ.code;
          const edLabel = educLabel(occ.education);

          return (
            <div
              key={occ.code}
              onClick={() => toggleExpand(occ.code)}
              style={{
                background: '#fff',
                border: isOpen ? '1px solid #1B3A4B' : '1px solid #E4E0D6',
                borderRadius: 12,
                marginBottom: 8,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.12s',
              }}
            >
              {/* Card top */}
              <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#1A1A1A', letterSpacing:'-0.2px', marginBottom:4 }}>
                    {occ.title}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    <span style={{
                      fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:6,
                      background:'#E8EFF5', color:'#1B3A4B',
                    }}>{occ.category}</span>
                    {edLabel && (
                      <span style={{
                        fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:6,
                        background:'#F0EDE4', color:'#6B6B6B',
                      }}>{edLabel}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:10, fontWeight:600, color:'#6B6B6B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:3 }}>Starting pay</div>
                  <div style={{ fontSize:24, fontWeight:800, color:'#1A1A1A', letterSpacing:'-1px', fontVariantNumeric:'tabular-nums' }}>
                    {fmt(occ.entryPay)}
                  </div>
                </div>
                <div style={{ fontSize:14, color:'#6B6B6B', flexShrink:0, transition:'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>↓</div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ borderTop:'1px solid #E4E0D6', padding:'20px 20px 22px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

                    {/* Pay range */}
                    <div>
                      <div style={{ fontSize:10, fontWeight:600, color:'#6B6B6B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>
                        Pay range
                      </div>
                      <div style={{ border:'1px solid #E4E0D6', borderRadius:8, overflow:'hidden' }}>
                        {[
                          { label:'Bottom 25%', val: occ.entryPay, featured: true },
                          { label:'Median', val: occ.median, featured: false },
                          { label:'Top 25%', val: occ.p75, featured: false },
                        ].map(row => (
                          <div key={row.label} style={{
                            display:'flex', justifyContent:'space-between', alignItems:'center',
                            padding:'9px 14px',
                            borderBottom: row.label !== 'Top 25%' ? '1px solid #E4E0D6' : 'none',
                            background: row.featured ? '#F0EDE4' : '#fff',
                          }}>
                            <span style={{ fontSize:13, color: row.featured ? '#1A1A1A' : '#4A4A4A', fontWeight: row.featured ? 600 : 400 }}>
                              {row.label}
                            </span>
                            <span style={{ fontSize: row.featured ? 15 : 13, fontWeight: row.featured ? 700 : 500, color: row.featured ? '#1B3A4B' : '#6B6B6B', fontVariantNumeric:'tabular-nums' }}>
                              {fmt(row.val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Job info */}
                    <div>
                      <div style={{ fontSize:10, fontWeight:600, color:'#6B6B6B', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>
                        About this role
                      </div>
                      <div style={{ border:'1px solid #E4E0D6', borderRadius:8, overflow:'hidden' }}>
                        {[
                          { label:'SOC code', val: occ.code },
                          { label:'Typical education', val: occ.education || 'Not specified' },
                          { label:'Total employed', val: occ.employment ? occ.employment.toLocaleString() : 'N/A' },
                        ].map((row, i, arr) => (
                          <div key={row.label} style={{
                            display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                            padding:'9px 14px',
                            borderBottom: i < arr.length - 1 ? '1px solid #E4E0D6' : 'none',
                          }}>
                            <span style={{ fontSize:13, color:'#6B6B6B' }}>{row.label}</span>
                            <span style={{ fontSize:13, color:'#1A1A1A', fontWeight:500, textAlign:'right', maxWidth:'55%' }}>{row.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* BLS link */}
                  <div style={{ marginTop:14, fontSize:12, color:'#6B6B6B' }}>
                    <a
                      href={`https://www.bls.gov/oes/current/oes${occ.code.replace('-','')}.htm`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ color:'#1B3A4B', fontWeight:500 }}
                    >
                      View full BLS data for this occupation →
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Load more */}
        {hasMore && !loading && (
          <div style={{ textAlign:'center', marginTop:20 }}>
            <button
              onClick={() => setPage(p => p + 1)}
              style={{
                fontSize:14, fontWeight:600,
                fontFamily:'Inter,sans-serif',
                padding:'12px 28px',
                borderRadius:8,
                border:'1px solid #1B3A4B',
                background:'#fff',
                color:'#1B3A4B',
                cursor:'pointer',
              }}
            >
              Show more ({filtered.length - paginated.length} remaining)
            </button>
          </div>
        )}

        {/* CTA */}
        <div style={{
          marginTop: 48,
          background: '#1B3A4B',
          borderRadius: 12,
          padding: '36px 36px',
        }}>
          <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.14em', color:'rgba(255,255,255,0.5)', marginBottom:10 }}>
            GradSimple Insiders · $12/month
          </p>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#fff', letterSpacing:'-0.3px', marginBottom:10, lineHeight:1.3 }}>
            Salary is one data point.<br />What about everything else?
          </h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.65, marginBottom:20, maxWidth:480 }}>
            Insiders covers which fields are actually adding entry-level roles, which are pulling back, and how AI is reshaping what employers want. Twice a month, in plain English.
          </p>
          <a
            href="https://gradsimple.com/gradsimple-insiders/"
            style={{
              display:'inline-block',
              fontSize:14, fontWeight:700,
              color:'#fff',
              background:'#FF8400',
              padding:'12px 24px',
              borderRadius:8,
              textDecoration:'none',
            }}
          >
            See what Insiders gets you →
          </a>
        </div>

        {/* Footer */}
        <p style={{ marginTop:28, fontSize:12, color:'#6B6B6B', textAlign:'center', lineHeight:1.65 }}>
          Data from the Bureau of Labor Statistics Occupational Employment and Wage Statistics (OEWS) program, May 2024.
          Entry-level pay reflects the 10th percentile annual wage. All figures are national estimates.
        </p>

      </div>
    </>
  );
}
