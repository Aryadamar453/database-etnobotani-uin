(() => {
  const plants = Array.isArray(window.PLANTS) ? window.PLANTS : [];
  const photoMap = window.PHOTO_MAP || {};
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];
  const PAGE_SIZE = 18;
  const state = {query:'', location:'', sort:'id-asc', unique:false, page:1};

  const escapeHtml = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const hash = str => [...String(str)].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0,0);
  const palette = ['#2d7654','#5d9b67','#98b77f','#d1bd64','#356d5d','#789a62'];
  function placeholderSvg(plant, index=0){
    const h=Math.abs(hash(plant.scientificName + index));
    const c1=palette[h%palette.length], c2=palette[(h+2)%palette.length];
    const initials=plant.scientificName.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-opacity=".22"/></filter></defs><rect width="900" height="620" fill="url(#g)"/><circle cx="720" cy="95" r="190" fill="#fff" opacity=".09"/><g filter="url(#s)" transform="translate(450 315)"><path d="M0 200C-22 95-8-25 25-180" fill="none" stroke="#e9f2e7" stroke-width="16" stroke-linecap="round"/><path d="M8-110C95-195 225-165 265-82 172-12 75-28 8-85z" fill="#eaf2d9" opacity=".92"/><path d="M-8-35C-95-120-225-90-258-6-171 54-72 28-8-8z" fill="#d4e8c1" opacity=".91"/><path d="M8 70C95-16 222 12 252 96 164 150 70 122 8 94z" fill="#eaf2d9" opacity=".9"/><path d="M-6 135C-82 70-188 97-212 166-140 211-61 190-6 158z" fill="#d4e8c1" opacity=".9"/></g><text x="54" y="540" font-family="Georgia,serif" font-size="88" font-weight="700" fill="#fff" opacity=".94">${initials}</text><text x="58" y="581" font-family="Arial,sans-serif" font-size="20" fill="#fff" opacity=".8">FOTO OBSERVASI ${String(plant.id).padStart(3,'0')}</text></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }
  const photosFor = p => {
    const mapped = photoMap[String(p.id)] || photoMap[p.id];
    if (Array.isArray(mapped) && mapped.length) return [0,1,2].map(i=>mapped[i] || mapped[0]);
    return [0,1,2].map(i=>placeholderSvg(p,i));
  };
  const uniqueNames = new Set(plants.map(p=>p.normalizedName)).size;
  const locationCounts = plants.reduce((a,p)=>(a[p.locationCode]=(a[p.locationCode]||0)+1,a),{});
  const nameCounts = plants.reduce((a,p)=>(a[p.normalizedName]=(a[p.normalizedName]||{name:p.scientificName,count:0}),a[p.normalizedName].count++,a),{});

  function init(){
    $('#footer-year').textContent = new Date().getFullYear();
    renderHeroStats(); populateLocationFilter(); renderCatalog(); renderStats(); renderLocations(); bindEvents();
  }
  function renderHeroStats(){
    const stats=[['450','Observasi tumbuhan'],[uniqueNames,'Nama ilmiah unik'],['6','Kawasan kampus'],[Math.max(...Object.values(locationCounts)),'Observasi terbanyak']];
    $('#hero-stats').innerHTML=stats.map(([v,l])=>`<div class="stat-item"><strong>${v}</strong><span>${l}</span></div>`).join('');
  }
  function populateLocationFilter(){
    const select=$('#location-filter');
    Object.keys(locationCounts).forEach(code=>select.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(code)}">${escapeHtml(code)} (${locationCounts[code]})</option>`));
  }
  function filtered(){
    let data=plants.filter(p=>{
      const q=state.query.toLowerCase();
      const match=!q || p.scientificName.toLowerCase().includes(q) || String(p.id).includes(q) || p.location.toLowerCase().includes(q);
      return match && (!state.location || p.locationCode===state.location);
    });
    if(state.unique){const seen=new Set();data=data.filter(p=>seen.has(p.normalizedName)?false:(seen.add(p.normalizedName),true));}
    data.sort((a,b)=>state.sort==='name-asc'?a.scientificName.localeCompare(b.scientificName):state.sort==='name-desc'?b.scientificName.localeCompare(a.scientificName):state.sort==='location'?a.location.localeCompare(b.location)||a.id-b.id:a.id-b.id);
    return data;
  }
  function renderCatalog(){
    const data=filtered(), pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE)); state.page=Math.min(state.page,pages);
    const chunk=data.slice((state.page-1)*PAGE_SIZE,state.page*PAGE_SIZE);
    $('#result-count').textContent=data.length;
    $('#active-filter').textContent=(state.location||state.query)?`· Filter aktif${state.location?' · '+state.location:''}${state.query?' · “'+state.query+'”':''}`:'';
    $('#plant-grid').innerHTML=chunk.length?chunk.map(cardHtml).join(''):`<div class="empty-state"><h3>Data tidak ditemukan</h3><p>Coba ubah kata kunci atau reset filter.</p></div>`;
    $$('.plant-card').forEach(card=>card.addEventListener('click',()=>openDetail(Number(card.dataset.id))));
    renderPagination(pages);
  }
  function cardHtml(p){const ph=photosFor(p);return `<article class="plant-card" data-id="${p.id}" tabindex="0"><div class="plant-image"><img src="${ph[0]}" alt="Dokumentasi ${escapeHtml(p.scientificName)}" loading="lazy"><span class="plant-badge">No. ${String(p.id).padStart(3,'0')}</span><span class="plant-photo-count">3 foto</span></div><div class="plant-body"><h3>${escapeHtml(p.scientificName)}</h3><p>${escapeHtml(p.location)}</p><div class="plant-meta"><span>${escapeHtml(p.locationCode)} · urutan ${p.locationNo}</span><strong>Lihat detail →</strong></div></div></article>`;}
  function renderPagination(pages){
    const root=$('#pagination'); if(pages<=1){root.innerHTML='';return;}
    let nums=[1,pages,state.page-1,state.page,state.page+1].filter(n=>n>=1&&n<=pages); nums=[...new Set(nums)].sort((a,b)=>a-b);
    let html=`<button data-page="${state.page-1}" ${state.page===1?'disabled':''}>←</button>`; let prev=0;
    nums.forEach(n=>{if(prev&&n-prev>1)html+='<span>…</span>';html+=`<button class="${n===state.page?'active':''}" data-page="${n}">${n}</button>`;prev=n;});
    html+=`<button data-page="${state.page+1}" ${state.page===pages?'disabled':''}>→</button>`;root.innerHTML=html;
    $$('button',root).forEach(b=>b.addEventListener('click',()=>{state.page=Number(b.dataset.page);renderCatalog();$('#katalog').scrollIntoView({behavior:'smooth'});}));
  }
  function openDetail(id){
    const p=plants.find(x=>x.id===id); if(!p)return; const ph=photosFor(p), count=nameCounts[p.normalizedName]?.count||1;
    $('#dialog-content').innerHTML=`<div class="detail-layout"><div class="detail-gallery">${ph.map((src,i)=>`<img src="${src}" alt="Foto ${i+1} ${escapeHtml(p.scientificName)}">`).join('')}</div><div class="detail-content"><span class="eyebrow">Observasi No. ${String(p.id).padStart(3,'0')}</span><h2>${escapeHtml(p.scientificName)}</h2><p>Data observasi tumbuhan pada ${escapeHtml(p.location)}.</p><div class="detail-table"><div class="detail-row"><strong>Nomor global</strong><span>${p.id} dari 450</span></div><div class="detail-row"><strong>Nomor lokasi</strong><span>${p.locationNo}</span></div><div class="detail-row"><strong>Lokasi</strong><span>${escapeHtml(p.location)}</span></div><div class="detail-row"><strong>Kode kawasan</strong><span>${escapeHtml(p.locationCode)}</span></div><div class="detail-row"><strong>Kemunculan nama</strong><span>${count} observasi dalam database</span></div><div class="detail-row"><strong>Status informasi</strong><span>Nama ilmiah sesuai dokumen sumber</span></div></div><div class="detail-actions"><button class="button primary" id="copy-link">Salin tautan data</button><button class="button soft" id="filter-location">Lihat lokasi ini</button></div></div></div>`;
    const d=$('#plant-dialog'); d.showModal(); history.replaceState(null,'',`#tanaman-${p.id}`);
    $('#copy-link').onclick=async()=>{const url=location.href;try{await navigator.clipboard.writeText(url);toast('Tautan berhasil disalin');}catch{toast('Salin alamat dari bilah browser');}};
    $('#filter-location').onclick=()=>{d.close();state.location=p.locationCode;$('#location-filter').value=p.locationCode;state.page=1;renderCatalog();location.hash='katalog';};
  }
  function renderStats(){
    const max=Math.max(...Object.values(locationCounts));
    $('#location-chart').innerHTML=Object.entries(locationCounts).map(([k,v])=>`<div class="bar-row"><span class="bar-label">${escapeHtml(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${(v/max)*100}%"></div></div><span class="bar-value">${v}</span></div>`).join('');
    const pct=Math.round(uniqueNames/plants.length*100);$('#donut-chart').innerHTML=`<div class="donut" style="background:conic-gradient(#d7b756 0 ${pct}%,#5f9f73 ${pct}% 100%)"><div class="donut-center"><strong>${uniqueNames}</strong><span>nama unik<br>${pct}% dari observasi</span></div></div>`;
    const top=Object.values(nameCounts).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)).slice(0,8);$('#top-species').innerHTML=top.map((x,i)=>`<li><span>${i+1}</span><em>${escapeHtml(x.name)}</em><strong>${x.count}×</strong></li>`).join('');
  }
  function renderLocations(){
    const full={FIKES:'Fakultas Ilmu Kesehatan',FK:'Fakultas Kedokteran',FEB:'Fakultas Ekonomi dan Bisnis',FAH:'Fakultas Adab dan Humaniora',FISIP:'Fakultas Ilmu Sosial dan Ilmu Politik','Kampus I':'Kawasan Kampus I/Rektorat'};
    $('#location-grid').innerHTML=Object.entries(locationCounts).map(([code,count],i)=>`<button class="location-card" data-location="${escapeHtml(code)}" style="background:linear-gradient(135deg,${palette[i%palette.length]},#0b4f34)"><small>KAWASAN ${String(i+1).padStart(2,'0')}</small><strong>${escapeHtml(full[code]||code)}</strong><span>${count} observasi · buka katalog →</span></button>`).join('');
    $$('.location-card').forEach(b=>b.onclick=()=>{state.location=b.dataset.location;$('#location-filter').value=state.location;state.page=1;renderCatalog();location.hash='katalog';});
  }
  function bindEvents(){
    $('#catalog-search').addEventListener('input',e=>{state.query=e.target.value.trim();state.page=1;renderCatalog();});
    $('#location-filter').addEventListener('change',e=>{state.location=e.target.value;state.page=1;renderCatalog();});
    $('#sort-filter').addEventListener('change',e=>{state.sort=e.target.value;renderCatalog();});
    $('#unique-toggle').addEventListener('change',e=>{state.unique=e.target.checked;state.page=1;renderCatalog();});
    $('#reset-filter').onclick=()=>{Object.assign(state,{query:'',location:'',sort:'id-asc',unique:false,page:1});$('#catalog-search').value='';$('#location-filter').value='';$('#sort-filter').value='id-asc';$('#unique-toggle').checked=false;renderCatalog();};
    $('#hero-search-form').addEventListener('submit',e=>{e.preventDefault();const q=$('#hero-search-input').value.trim();state.query=q;$('#catalog-search').value=q;state.page=1;renderCatalog();location.hash='katalog';});
    $('.menu-button').onclick=()=>{const nav=$('#main-nav'),open=nav.classList.toggle('open');$('.menu-button').setAttribute('aria-expanded',open)};$$('.main-nav a').forEach(a=>a.onclick=()=>$('#main-nav').classList.remove('open'));
    $('.dialog-close').onclick=()=>$('#plant-dialog').close();$('#plant-dialog').addEventListener('click',e=>{if(e.target===$('#plant-dialog'))e.target.close();});
    $$('.plant-card').forEach(c=>c.addEventListener('keydown',e=>{if(e.key==='Enter')openDetail(Number(c.dataset.id));}));
    const m=location.hash.match(/^#tanaman-(\d+)$/);if(m)setTimeout(()=>openDetail(Number(m[1])),200);
  }
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);}
  document.addEventListener('DOMContentLoaded',init);
})();
