(()=>{
  'use strict';
  const plants = Array.isArray(window.PLANTS) ? window.PLANTS : [];
  const photoMap = window.PHOTO_MAP || {};
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
  const PAGE_SIZE = 12;
  const palette=['#0b4f34','#4f8a5b','#7d9b52','#a8842c','#3d7251','#6c7f3d'];
  const state={query:'',location:'',family:'',plantCategory:'',disease:'',sort:'id-asc',unique:false,page:1};

  const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const slug=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function placeholderSvg(plant,index){
    const initials=(plant.localName||plant.scientificName||'T').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
    const colors=['#2e6d4b','#4d8a58','#8b7a34'];
    const c=colors[index%colors.length];
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650"><rect width="900" height="650" fill="${c}"/><circle cx="720" cy="115" r="230" fill="#d9eac8" opacity=".16"/><path d="M70 580C170 395 270 260 440 90M250 590C330 430 470 285 730 120" fill="none" stroke="#d4e8c1" stroke-width="24" opacity=".9"/><text x="54" y="540" font-family="Georgia,serif" font-size="88" font-weight="700" fill="#fff" opacity=".94">${initials}</text><text x="58" y="581" font-family="Arial,sans-serif" font-size="20" fill="#fff" opacity=".8">FOTO OBSERVASI ${String(plant.id).padStart(3,'0')}</text></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  }
  const photosFor=p=>{
    const mapped=photoMap[String(p.id)]||photoMap[p.id];
    if(Array.isArray(mapped)&&mapped.length) return [0,1,2].map(i=>mapped[i]||mapped[0]);
    return [0,1,2].map(i=>placeholderSvg(p,i));
  };
  const countBy=(arr,keyFn)=>{
    const out={};
    arr.forEach(x=>{const k=keyFn(x);if(k)out[k]=(out[k]||0)+1;});
    return out;
  };
  const uniqueSorted=arr=>[...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
  const locationCounts=countBy(plants,p=>p.locationCode);
  const familyCounts=countBy(plants,p=>p.family);
  const plantCategoryCounts={};
  const diseaseCounts={};
  plants.forEach(p=>{
    (p.plantCategories||[]).forEach(x=>plantCategoryCounts[x]=(plantCategoryCounts[x]||0)+1);
    (p.diseaseCategories||[]).forEach(x=>diseaseCounts[x]=(diseaseCounts[x]||0)+1);
  });
  const uniqueNames=new Set(plants.map(p=>p.canonicalName||p.normalizedName)).size;
  const uniqueFamilies=Object.keys(familyCounts).length;

  function init(){
    $('#footer-year').textContent=new Date().getFullYear();
    populateFilters();
    renderHeroStats();
    renderHeroPhotoShowcase();
    renderCatalog();
    renderStats();
    renderCategories();
    renderLocations();
    bindEvents();
    const m=location.hash.match(/^#tanaman-(\d+)$/);
    if(m)setTimeout(()=>openDetail(Number(m[1])),200);
  }


  function renderHeroPhotoShowcase(){
    const picks=[plants[0],plants[Math.floor(plants.length/2)],plants[plants.length-1]].filter(Boolean);
    const figures=picks.map((p,i)=>{
      const src=photosFor(p)[i%3];
      return `<figure class="hero-photo hero-photo-${i+1}"><img src="${src}" alt="Dokumentasi ${escapeHtml(p.scientificName)}"><figcaption><span>No. ${String(p.id).padStart(3,'0')}</span><em>${escapeHtml(p.scientificName)}</em></figcaption></figure>`;
    }).join('');
    const root=$('#hero-photo-showcase');
    if(root)root.innerHTML=`${figures}<div class="hero-count-badge"><strong>${plants.length}</strong><span>observasi<br>tumbuhan</span></div>`;
  }

  function renderHeroStats(){
    const stats=[
      [plants.length,'Observasi tumbuhan'],
      [uniqueNames,'Nama ilmiah unik'],
      [uniqueFamilies,'Famili'],
      [Object.keys(locationCounts).length,'Kawasan kampus']
    ];
    $('#hero-stats').innerHTML=stats.map(([v,l])=>`<div class="stat-item"><strong>${v}</strong><span>${l}</span></div>`).join('');
  }

  function addOptions(select,items,countMap){
    items.forEach(x=>select.insertAdjacentHTML('beforeend',`<option value="${escapeHtml(x)}">${escapeHtml(x)}${countMap?` (${countMap[x]||0})`:''}</option>`));
  }
  function populateFilters(){
    addOptions($('#location-filter'),Object.keys(locationCounts),locationCounts);
    addOptions($('#family-filter'),uniqueSorted(plants.map(p=>p.family)),familyCounts);
    addOptions($('#plant-category-filter'),Object.keys(plantCategoryCounts),plantCategoryCounts);
    addOptions($('#disease-filter'),Object.keys(diseaseCounts),diseaseCounts);
  }

  function searchText(p){
    return slug([
      p.id,p.sourceNo,p.localName,p.scientificName,p.family,p.location,p.locationCode,
      p.usedParts,p.processing,(p.plantCategories||[]).join(' '),(p.diseaseCategories||[]).join(' ')
    ].join(' '));
  }
  function filtered(){
    const q=slug(state.query);
    let data=plants.filter(p=>{
      if(q&&!searchText(p).includes(q))return false;
      if(state.location&&p.locationCode!==state.location)return false;
      if(state.family&&p.family!==state.family)return false;
      if(state.plantCategory&&!(p.plantCategories||[]).includes(state.plantCategory))return false;
      if(state.disease&&!(p.diseaseCategories||[]).includes(state.disease))return false;
      return true;
    });
    if(state.unique){
      const seen=new Set();
      data=data.filter(p=>{
        const k=p.canonicalName||p.normalizedName;
        if(seen.has(k))return false;
        seen.add(k);return true;
      });
    }
    data.sort((a,b)=>{
      if(state.sort==='local-asc')return a.localName.localeCompare(b.localName,'id')||a.id-b.id;
      if(state.sort==='name-asc')return a.scientificName.localeCompare(b.scientificName,'id')||a.id-b.id;
      if(state.sort==='family')return a.family.localeCompare(b.family,'id')||a.scientificName.localeCompare(b.scientificName,'id');
      if(state.sort==='location')return a.location.localeCompare(b.location,'id')||a.locationNo-b.locationNo;
      return a.id-b.id;
    });
    return data;
  }

  function chips(items,klass=''){
    if(!items||!items.length)return '<span class="chip muted">Belum terklasifikasi</span>';
    return items.map(x=>`<span class="chip ${klass}">${escapeHtml(x)}</span>`).join('');
  }
  function cardHtml(p){
    const ph=photosFor(p);
    return `<article class="plant-card detailed-card" data-id="${p.id}" tabindex="0">
      <div class="plant-image">
        <img src="${ph[0]}" alt="Dokumentasi ${escapeHtml(p.scientificName)}" loading="lazy">
        <span class="plant-badge">No. ${String(p.id).padStart(3,'0')}</span>
        <span class="plant-photo-count">3 foto</span>
      </div>
      <div class="plant-body">
        <span class="local-name">${escapeHtml(p.localName)}</span>
        <h3>${escapeHtml(p.scientificName)}</h3>
        <p class="family-line">${escapeHtml(p.family)}</p>
        <div class="mini-chips">${chips((p.plantCategories||[]).slice(0,3),'plant-chip')}</div>
        <div class="plant-meta"><span>${escapeHtml(p.locationCode)} · urutan ${p.locationNo}</span><strong>Lihat detail →</strong></div>
      </div>
    </article>`;
  }

  function renderCatalog(){
    const data=filtered();
    const pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE));
    state.page=Math.min(state.page,pages);
    const chunk=data.slice((state.page-1)*PAGE_SIZE,state.page*PAGE_SIZE);
    $('#result-count').textContent=data.length;
    const active=[
      state.location,state.family,state.plantCategory,state.disease,state.query?`“${state.query}”`:''
    ].filter(Boolean);
    $('#active-filter').textContent=active.length?`· ${active.join(' · ')}`:'';
    $('#plant-grid').innerHTML=chunk.length?chunk.map(cardHtml).join(''):`<div class="empty-state"><h3>Data tidak ditemukan</h3><p>Coba ubah kata kunci atau reset filter.</p></div>`;
    $$('.plant-card').forEach(card=>{
      card.addEventListener('click',()=>openDetail(Number(card.dataset.id)));
      card.addEventListener('keydown',e=>{if(e.key==='Enter')openDetail(Number(card.dataset.id));});
    });
    renderPagination(pages);
  }

  function renderPagination(pages){
    const root=$('#pagination');
    if(pages<=1){root.innerHTML='';return;}
    let nums=[1,pages,state.page-1,state.page,state.page+1].filter(n=>n>=1&&n<=pages);
    nums=[...new Set(nums)].sort((a,b)=>a-b);
    let html=`<button data-page="${state.page-1}" ${state.page===1?'disabled':''}>←</button>`;
    let prev=0;
    nums.forEach(n=>{
      if(prev&&n-prev>1)html+='<span>…</span>';
      html+=`<button class="${n===state.page?'active':''}" data-page="${n}">${n}</button>`;
      prev=n;
    });
    html+=`<button data-page="${state.page+1}" ${state.page===pages?'disabled':''}>→</button>`;
    root.innerHTML=html;
    $$('button',root).forEach(b=>b.addEventListener('click',()=>{
      state.page=Number(b.dataset.page);renderCatalog();$('#katalog').scrollIntoView({behavior:'smooth'});
    }));
  }

  function detailRow(label,value){
    return `<div class="detail-row"><strong>${escapeHtml(label)}</strong><span>${value}</span></div>`;
  }
  function openDetail(id){
    const p=plants.find(x=>x.id===id);if(!p)return;
    const ph=photosFor(p);
    $('#dialog-content').innerHTML=`<div class="detail-layout detailed-layout">
      <div class="detail-gallery">${ph.map((src,i)=>`<img src="${src}" alt="Foto ${i+1} ${escapeHtml(p.scientificName)}">`).join('')}</div>
      <div class="detail-content">
        <span class="eyebrow">Observasi No. ${String(p.id).padStart(3,'0')}</span>
        <h2>${escapeHtml(p.localName)}</h2>
        <p class="scientific-detail"><em>${escapeHtml(p.scientificName)}</em></p>
        <div class="detail-chips">${chips(p.plantCategories,'plant-chip')}</div>
        <section class="detail-section">
          <h3>Informasi umum</h3>
          <div class="detail-table">
            ${detailRow('Nomor observasi',`${p.id} dari ${plants.length}`)}
            ${detailRow('Nomor di lokasi',p.locationNo)}
            ${detailRow('Lokasi',escapeHtml(p.location))}
            ${detailRow('Famili',escapeHtml(p.family))}
          </div>
        </section>
        <section class="detail-section">
          <h3>Informasi etnobotani</h3>
          <div class="prose-box"><strong>Bagian dimanfaatkan</strong><p>${escapeHtml(p.usedParts)}</p></div>
          <div class="prose-box"><strong>Cara pengolahan</strong><p>${escapeHtml(p.processing)}</p></div>
        </section>
        <section class="detail-section">
          <h3>Kategori penyakit berdasarkan DiPiro</h3>
          <div class="detail-chips disease-chips">${chips(p.diseaseCategories,'disease-chip')}</div>
          <small>${p.diseaseCategoryCount} kategori penyakit tercatat</small>
        </section>
        <div class="detail-actions">
          <button class="button primary" id="copy-link">Salin tautan data</button>
          <button class="button soft" id="filter-location">Lihat lokasi ini</button>
        </div>
      </div>
    </div>`;
    const d=$('#plant-dialog');
    d.showModal();
    history.replaceState(null,'',`#tanaman-${p.id}`);
    $('#copy-link').onclick=async()=>{
      const url=location.href;
      try{await navigator.clipboard.writeText(url);toast('Tautan berhasil disalin');}
      catch{toast('Salin alamat dari bilah browser');}
    };
    $('#filter-location').onclick=()=>{
      d.close();state.location=p.locationCode;$('#location-filter').value=p.locationCode;state.page=1;renderCatalog();location.hash='katalog';
    };
  }

  function renderBar(rootId,data,limit){
    const entries=Object.entries(data).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'id')).slice(0,limit||999);
    const max=Math.max(1,...entries.map(x=>x[1]));
    $(rootId).innerHTML=entries.map(([k,v])=>`<div class="bar-row"><span class="bar-label">${escapeHtml(k)}</span><div class="bar-track"><div class="bar-fill" style="width:${(v/max)*100}%"></div></div><span class="bar-value">${v}</span></div>`).join('');
  }
  function renderStats(){
    renderBar('#location-chart',locationCounts);
    const pct=Math.round(uniqueNames/plants.length*100);
    $('#donut-chart').innerHTML=`<div class="donut" style="background:conic-gradient(#d7b756 0 ${pct}%,#5f9f73 ${pct}% 100%)"><div class="donut-center"><strong>${uniqueNames}</strong><span>nama unik<br>${pct}% dari observasi</span></div></div>`;
    $('#top-families').innerHTML=Object.entries(familyCounts).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'id')).slice(0,8).map(([name,count],i)=>`<li><span>${i+1}</span><em>${escapeHtml(name)}</em><strong>${count}×</strong></li>`).join('');
    renderBar('#plant-category-chart',plantCategoryCounts);
    renderBar('#disease-chart',diseaseCounts,10);
  }

  function categoryButton(label,count,type){
    return `<button class="category-filter-button" data-type="${type}" data-value="${escapeHtml(label)}"><span>${escapeHtml(label)}</span><strong>${count}</strong></button>`;
  }
  function renderCategories(){
    $('#plant-category-list').innerHTML=Object.entries(plantCategoryCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>categoryButton(k,v,'plant')).join('');
    $('#disease-list').innerHTML=Object.entries(diseaseCounts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>categoryButton(k,v,'disease')).join('');
    $$('.category-filter-button').forEach(b=>b.onclick=()=>{
      if(b.dataset.type==='plant'){
        state.plantCategory=b.dataset.value;$('#plant-category-filter').value=state.plantCategory;
      }else{
        state.disease=b.dataset.value;$('#disease-filter').value=state.disease;
      }
      state.page=1;renderCatalog();location.hash='katalog';
    });
  }

  function renderLocations(){
    const full={FIKES:'Fakultas Ilmu Kesehatan',FK:'Fakultas Kedokteran',FEB:'Fakultas Ekonomi dan Bisnis',FAH:'Fakultas Adab dan Humaniora',FISIP:'Fakultas Ilmu Sosial dan Ilmu Politik','Kampus I':'Kawasan Kampus I/Rektorat'};
    $('#location-grid').innerHTML=Object.entries(locationCounts).map(([code,count],i)=>`<button class="location-card" data-location="${escapeHtml(code)}" style="background:linear-gradient(135deg,${palette[i%palette.length]},#0b4f34)"><small>KAWASAN ${String(i+1).padStart(2,'0')}</small><strong>${escapeHtml(full[code]||code)}</strong><span>${count} observasi · buka katalog →</span></button>`).join('');
    $$('.location-card').forEach(b=>b.onclick=()=>{
      state.location=b.dataset.location;$('#location-filter').value=state.location;state.page=1;renderCatalog();location.hash='katalog';
    });
  }

  function resetFilters(){
    Object.assign(state,{query:'',location:'',family:'',plantCategory:'',disease:'',sort:'id-asc',unique:false,page:1});
    $('#catalog-search').value='';
    $('#location-filter').value='';
    $('#family-filter').value='';
    $('#plant-category-filter').value='';
    $('#disease-filter').value='';
    $('#sort-filter').value='id-asc';
    $('#unique-toggle').checked=false;
    renderCatalog();
  }
  function bindEvents(){
    $('#catalog-search').addEventListener('input',e=>{state.query=e.target.value.trim();state.page=1;renderCatalog();});
    $('#location-filter').addEventListener('change',e=>{state.location=e.target.value;state.page=1;renderCatalog();});
    $('#family-filter').addEventListener('change',e=>{state.family=e.target.value;state.page=1;renderCatalog();});
    $('#plant-category-filter').addEventListener('change',e=>{state.plantCategory=e.target.value;state.page=1;renderCatalog();});
    $('#disease-filter').addEventListener('change',e=>{state.disease=e.target.value;state.page=1;renderCatalog();});
    $('#sort-filter').addEventListener('change',e=>{state.sort=e.target.value;renderCatalog();});
    $('#unique-toggle').addEventListener('change',e=>{state.unique=e.target.checked;state.page=1;renderCatalog();});
    $('#reset-filter').onclick=resetFilters;
    $('#hero-search-form').addEventListener('submit',e=>{
      e.preventDefault();const q=$('#hero-search-input').value.trim();state.query=q;$('#catalog-search').value=q;state.page=1;renderCatalog();location.hash='katalog';
    });
    $('.menu-button').onclick=()=>{
      const nav=$('#main-nav'),open=nav.classList.toggle('open');$('.menu-button').setAttribute('aria-expanded',open);
    };
    $$('.main-nav a').forEach(a=>a.onclick=()=>$('#main-nav').classList.remove('open'));
    $('.dialog-close').onclick=()=>$('#plant-dialog').close();
    $('#plant-dialog').addEventListener('click',e=>{if(e.target===$('#plant-dialog'))e.target.close();});
  }
  function toast(msg){
    const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);
  }
  document.addEventListener('DOMContentLoaded',init);
})();