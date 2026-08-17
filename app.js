const STORE = 'synchub-v2';
const DEFAULT_CATEGORIES = ['Headline', 'About / Bio', 'Skills & Stack', 'Experience', 'Projects', 'Contact Info'];
const PORTAL_TYPES = ['LinkedIn', 'Job board', 'Company career site', 'Portfolio', 'General'];
const seeded = { contents: [
  { id: 'headline', title: 'Product-focused software engineer', category: 'Headline', text: 'Full stack engineer building clear, reliable products for people.', updatedAt: Date.now() - 86400000 },
  { id: 'skills', title: 'Core skills', category: 'Skills & Stack', text: 'JavaScript, React, Node.js, TypeScript, SQL, GitHub Actions', updatedAt: Date.now() - 3600000 }
], portals: [
  { id: 'linkedin', name: 'LinkedIn Profile', type: 'LinkedIn', url: 'https://www.linkedin.com/', contentIds: ['headline', 'skills'], synced: { headline: Date.now() - 86400000, skills: Date.now() - 3600000 } },
  { id: 'wellfound', name: 'Wellfound', type: 'Job board', url: 'https://wellfound.com/', contentIds: ['headline'], synced: { headline: Date.now() - 86400000 } }
], categories: [...DEFAULT_CATEGORIES] };
let state = loadState(), editingContent = null, editingPortal = null, activeCategory = 'all';
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const id = () => crypto.randomUUID?.() || Math.random().toString(36).slice(2);
const escape = (value) => String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
function loadState(){
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE));
    if(!parsed) return structuredClone(seeded);
    if(!Array.isArray(parsed.categories) || !parsed.categories.length) parsed.categories = [...DEFAULT_CATEGORIES];
    return parsed;
  } catch { return structuredClone(seeded); }
}
function save(){ localStorage.setItem(STORE, JSON.stringify(state)); render(); }
function stale(portal, content){ return !portal.synced?.[content.id] || portal.synced[content.id] < content.updatedAt; }
function fmtDate(ms){ return new Intl.DateTimeFormat(undefined,{month:'numeric',day:'numeric',year:'numeric'}).format(ms); }
const ICONS = {
  'refresh-cw': '<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>',
  'github': '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path>',
  'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
  'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>',
  'layers-3': '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>',
  'briefcase-business': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
  'check-circle-2': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
  'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
  'search': '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
  'plus': '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
  'git-compare-arrows': '<circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="18" r="3"></circle><path d="M9 6h8a2 2 0 0 1 2 2v6"></path><path d="M15 18H7a2 2 0 0 1-2-2V10"></path><polyline points="16 5 19 6 18 9"></polyline><polyline points="8 19 5 18 6 15"></polyline>',
  'x': '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
  'cloud-download': '<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6.5 6.5 0 0 0-12.6-1.7A4.5 4.5 0 0 0 6.5 19h11z"></path><polyline points="9 16 12 19 15 16"></polyline><line x1="12" y1="12" x2="12" y2="19"></line>',
  'cloud-upload': '<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6.5 6.5 0 0 0-12.6-1.7A4.5 4.5 0 0 0 6.5 19h11z"></path><polyline points="9 15 12 12 15 15"></polyline><line x1="12" y1="12" x2="12" y2="19"></line>',
  'folder-plus': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line>',
  'pencil': '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>',
  'trash-2': '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>',
  'external-link': '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>',
  'sliders': '<line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line>'
};
function refreshIcons(root){
  (root||document).querySelectorAll('[data-lucide]').forEach(el=>{
    const paths = ICONS[el.getAttribute('data-lucide')];
    if(!paths) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','2');
    svg.setAttribute('stroke-linecap','round');
    svg.setAttribute('stroke-linejoin','round');
    if(el.id) svg.id = el.id;
    if(el.className) svg.setAttribute('class', el.className.baseVal || el.className);
    svg.innerHTML = paths;
    el.replaceWith(svg);
  });
}
function showToast(message){
  let toast = $('#toast');
  if(!toast){ toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; document.body.appendChild(toast); }
  toast.innerHTML = `<i data-lucide="check-circle-2"></i><span>${escape(message)}</span>`;
  refreshIcons();
  requestAnimationFrame(()=>toast.classList.add('show'));
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=> toast.classList.remove('show'), 2200);
}
function populateSelects(){
  $('#contentCategory').innerHTML = state.categories.map(c=>`<option>${escape(c)}</option>`).join('');
  $('#portalType').innerHTML = PORTAL_TYPES.map(t=>`<option>${escape(t)}</option>`).join('');
  $('#categoryFilters').innerHTML = ['all', ...state.categories].map(c=>`<button type="button" class="filter-chip ${activeCategory===c?'active':''}" data-category="${escape(c)}">${c==='all'?'All Categories':escape(c)}</button>`).join('');
}
function renderCategoryList(){
  const list = $('#categoryManageList');
  if(!list) return;
  list.innerHTML = state.categories.map(c=>{
    const count = state.contents.filter(x=>x.category===c).length;
    return `<div class="category-row"><span class="category-row-name">${escape(c)}</span><div class="category-row-right">${count?`<span class="tag">${count} item${count===1?'':'s'}</span>`:''}<button class="icon-button" data-remove-category="${escape(c)}" title="Remove category"><i data-lucide="trash-2"></i></button></div></div>`;
  }).join('');
  refreshIcons(list);
}
function openCategoryManager(){ renderCategoryList(); const input=$('#newCategoryInput'); if(input) input.value=''; $('#categoryDialog').showModal(); }
function render(){
  const staleItems = state.portals.flatMap(p => state.contents.filter(c => p.contentIds.includes(c.id) && stale(p,c)));
  $('#contentCount').textContent = state.contents.length; $('#contentTabCount').textContent = state.contents.length;
  $('#portalCount').textContent = state.portals.length;
  $('#staleCount').textContent = staleItems.length;
  $('#staleLabel').textContent = staleItems.length ? 'Outdated content detected on portals' : 'All connected portals are fully updated';
  $('#staleIconBox').className = `stat-icon ${staleItems.length ? 'amber' : 'teal'}`;
  $('#staleIcon').setAttribute('data-lucide', staleItems.length ? 'alert-triangle' : 'check-circle-2');
  const portalPill = $('#portalTabPill');
  if (staleItems.length) { portalPill.textContent = `${staleItems.length} update${staleItems.length===1?'':'s'} needed`; portalPill.classList.remove('hidden'); }
  else { portalPill.classList.add('hidden'); }
  renderContent(); renderPortals(); refreshIcons();
}
function renderContent(){
  const query=$('#searchInput').value.toLowerCase();
  const list=state.contents.filter(c=>(activeCategory==='all'||c.category===activeCategory)&&(`${c.title} ${c.text}`).toLowerCase().includes(query));
  const grid=$('#contentGrid');
  if(!list.length){ grid.innerHTML=$('#emptyState').innerHTML; return; }
  grid.innerHTML=list.map(c=>`<article class="content-card"><div class="card-top"><span class="category">${escape(c.category)}</span><div class="card-actions"><button class="icon-button" data-edit-content="${c.id}" title="Edit content"><i data-lucide="pencil"></i></button><button class="icon-button" data-delete-content="${c.id}" title="Delete content"><i data-lucide="trash-2"></i></button></div></div><h2>${escape(c.title)}</h2><div class="content-text">${escape(c.text)}</div><div class="card-foot"><span>Updated: ${fmtDate(c.updatedAt)}</span><span class="id-tag">ID: ${c.id.replace(/-/g,'').slice(0,6)}</span></div></article>`).join('');
}
function renderPortals(){
  const list=$('#portalList');
  if(!state.portals.length){ list.innerHTML=$('#emptyState').innerHTML.replace('Nothing here yet','No portals yet').replace('Add your first item','Add a job portal'); return; }
  list.innerHTML=state.portals.map(p=>{
    const assigned=state.contents.filter(c=>p.contentIds.includes(c.id));
    const isStale=assigned.some(c=>stale(p,c));
    return `<article class="portal-card"><div class="portal-head"><div class="portal-logo">${escape(p.name.slice(0,2).toUpperCase())}</div><div class="portal-info"><div class="portal-title"><h2>${escape(p.name)}</h2><span class="type-chip">${escape(p.type.toUpperCase())}</span><span class="status ${isStale?'stale':'fresh'}"><i data-lucide="${isStale?'alert-triangle':'check-circle-2'}"></i>${isStale?'Need Update':'Fully Updated'}</span></div><a class="portal-link" target="_blank" rel="noreferrer" href="${escape(p.url)}">${escape(p.url)} <i data-lucide="external-link"></i></a></div><div class="card-actions"><button class="button ghost small" data-edit-portal="${p.id}"><i data-lucide="pencil"></i>Configure Contents</button><button class="icon-button" data-delete-portal="${p.id}" title="Delete portal"><i data-lucide="trash-2"></i></button></div></div><div class="portal-body"><h3>ASSIGNED CONTENT &amp; SYNC STATUS (${assigned.length})</h3><div class="assigned-list">${assigned.length?assigned.map(c=>`<div class="assigned-item"><div class="assigned-main"><div class="assigned-title-row"><strong>${escape(c.title)}</strong><span class="tag">${escape(c.category.toLowerCase())}</span></div><p class="assigned-text">${escape(c.text)}</p></div><div class="assigned-actions"><span class="status ${stale(p,c)?'stale':'fresh'}">${stale(p,c)?'Need Update':'Updated'}</span><button class="mini-btn ${stale(p,c)?'update':''}" data-mark="${p.id}|${c.id}">${stale(p,c)?'Mark Updated':'Mark Stale'}</button></div></div>`).join(''):'<div class="empty-state"><p>No content is assigned to this portal. Use Configure Contents to choose some.</p></div>'}</div></div></article>`;
  }).join('');
}
function openContent(item){ editingContent=item||null; $('#contentDialogTitle').textContent=item?'Edit Content Item':'Add Content Item'; $('#contentSubmit').textContent=item?'Save Changes':'Create Content'; $('#contentTitle').value=item?.title||''; $('#contentCategory').value=item?.category||state.categories[0]; $('#contentText').value=item?.text||''; $('#contentDialog').showModal(); }
function assignmentMarkup(selected=[]){
  const container=$('#assignmentList');
  container.innerHTML=state.contents.length?state.contents.map(c=>`<label class="assignment"><div class="assignment-info"><div class="assignment-title"><strong>${escape(c.title)}</strong><span class="tag">${escape(c.category.toLowerCase())}</span></div><p>${escape(c.text.slice(0,90))}</p></div><input type="checkbox" value="${c.id}" ${selected.includes(c.id)?'checked':''}></label>`).join(''):'<div class="empty-state"><p>Add content first, then it can be selected here.</p></div>';
  updateAssignmentCount();
}
function updateAssignmentCount(){ $('#assignmentCount').textContent=`(${$$('#assignmentList input:checked').length} selected)`; }
function openPortal(item){ editingPortal=item||null; $('#portalDialogTitle').textContent=item?'Configure Job Portal':'Add Job Portal'; $('#portalSubmit').textContent=item?'Save Changes':'Create Portal'; $('#portalName').value=item?.name||''; $('#portalType').value=item?.type||PORTAL_TYPES[0]; $('#portalUrl').value=item?.url||''; assignmentMarkup(item?.contentIds||[]); $('#portalDialog').showModal(); }
function getGithubSettings(){ return { token: sessionStorage.getItem('synchub-token') || '', repo: localStorage.getItem('synchub-repo') || '', branch: localStorage.getItem('synchub-branch') || 'main', path: localStorage.getItem('synchub-path') || 'synchub-data.json' }; }
function openGithub(){ const s=getGithubSettings(); $('#githubToken').value=s.token; $('#githubRepo').value=s.repo; $('#githubBranch').value=s.branch; $('#githubPath').value=s.path; $('#syncStatus').textContent=''; $('#githubDialog').showModal(); }
function githubSettings(){ const settings={token:$('#githubToken').value.trim(),repo:$('#githubRepo').value.trim(),branch:$('#githubBranch').value.trim(),path:$('#githubPath').value.trim()}; sessionStorage.setItem('synchub-token',settings.token); localStorage.setItem('synchub-repo',settings.repo); localStorage.setItem('synchub-branch',settings.branch); localStorage.setItem('synchub-path',settings.path); return settings; }
async function githubRequest(mode){ const s=githubSettings(), msg=$('#syncStatus'); if(!s.token||!s.repo||!s.branch||!s.path){ msg.textContent='Add your token, repository, branch, and file path.'; msg.className='sync-status error'; return; } msg.textContent=mode==='save'?'Saving data to GitHub...':'Loading data from GitHub...'; msg.className='sync-status'; const url=`https://api.github.com/repos/${s.repo}/contents/${s.path}?ref=${encodeURIComponent(s.branch)}`; const headers={Authorization:`Bearer ${s.token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}; try { if(mode==='load'){ const r=await fetch(url,{headers}); if(!r.ok)throw new Error((await r.json()).message||r.statusText); const data=await r.json(); const bytes=Uint8Array.from(atob(data.content.replace(/\n/g,'')),char=>char.charCodeAt(0)); state=JSON.parse(new TextDecoder().decode(bytes)); save(); msg.textContent='Loaded your data from GitHub.'; msg.className='sync-status success'; } else { const existing=await fetch(url,{headers}); let sha; if(existing.ok)sha=(await existing.json()).sha; else if(existing.status!==404)throw new Error((await existing.json()).message||existing.statusText); const bytes=new TextEncoder().encode(JSON.stringify(state,null,2)); let binary=''; bytes.forEach(byte=>binary+=String.fromCharCode(byte)); const content=btoa(binary); const r=await fetch(url,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Sync SyncHub profile data',content,branch:s.branch,...(sha?{sha}:{})})}); if(!r.ok)throw new Error((await r.json()).message||r.statusText); msg.textContent='Saved. Your repository now has the latest data.'; msg.className='sync-status success'; } } catch(error){ msg.textContent=`GitHub sync failed: ${error.message}`; msg.className='sync-status error'; } }
document.addEventListener('click',e=>{
  const chip=e.target.closest('.filter-chip');
  if(chip){ activeCategory=chip.dataset.category; populateSelects(); renderContent(); refreshIcons(); return; }
  const target=e.target.closest('button');
  if(!target)return;
  if(target.dataset.close)$('#'+target.dataset.close).close();
  if(target.id==='addContentBtn')openContent();
  if(target.id==='addPortalBtn')openPortal();
  if(target.id==='githubBtn')openGithub();
  if(target.id==='manageCategoriesBtn')openCategoryManager();
  if(target.id==='addCategoryBtn'){
    const input=$('#newCategoryInput'), val=input.value.trim();
    if(!val) return;
    if(state.categories.some(c=>c.toLowerCase()===val.toLowerCase())){ alert('That category already exists.'); return; }
    state.categories.push(val); input.value='';
    populateSelects(); renderCategoryList(); save(); showToast('Category added');
  }
  if(target.dataset.removeCategory){
    const cat=target.dataset.removeCategory;
    if(state.categories.length<=1){ alert('You need at least one category.'); return; }
    const inUse=state.contents.some(c=>c.category===cat);
    const fallback=state.categories.find(c=>c!==cat);
    if(inUse && !confirm(`"${cat}" is used by some content items. Remove it and move those items to "${fallback}"?`)) return;
    state.contents.forEach(c=>{ if(c.category===cat) c.category=fallback; });
    state.categories=state.categories.filter(c=>c!==cat);
    if(activeCategory===cat) activeCategory='all';
    populateSelects(); renderCategoryList(); save(); showToast('Category removed');
  }
  if(target.id==='selectAllBtn'){ $('#assignmentList').querySelectorAll('input[type=checkbox]').forEach(i=>i.checked=true); updateAssignmentCount(); }
  if(target.id==='deselectAllBtn'){ $('#assignmentList').querySelectorAll('input[type=checkbox]').forEach(i=>i.checked=false); updateAssignmentCount(); }
  if(target.id==='exportBtn'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='synchub-data.json';a.click();URL.revokeObjectURL(a.href);showToast('Data exported');}
  if(target.dataset.editContent)openContent(state.contents.find(c=>c.id===target.dataset.editContent));
  if(target.dataset.editPortal)openPortal(state.portals.find(p=>p.id===target.dataset.editPortal));
  if(target.dataset.deleteContent){const content=state.contents.find(c=>c.id===target.dataset.deleteContent); if(confirm(`Delete "${content.title}"? It will also be removed from every portal.`)){state.contents=state.contents.filter(c=>c.id!==content.id);state.portals.forEach(p=>{p.contentIds=p.contentIds.filter(i=>i!==content.id);delete p.synced[content.id];});save();showToast('Content deleted');}}
  if(target.dataset.deletePortal&&confirm('Delete this portal?')){state.portals=state.portals.filter(p=>p.id!==target.dataset.deletePortal);save();showToast('Portal deleted');}
  if(target.dataset.mark){const [portalId,contentId]=target.dataset.mark.split('|'),p=state.portals.find(x=>x.id===portalId),c=state.contents.find(x=>x.id===contentId);const wasStale=stale(p,c);if(wasStale){p.synced[contentId]=Date.now();showToast('Marked as Updated!');}else{p.synced[contentId]=0;}save();}
  if(target.id==='saveGithubBtn')githubRequest('save');
  if(target.id==='loadGithubBtn')githubRequest('load');
});
document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===tab));$('#contentView').classList.toggle('hidden',tab.dataset.view!=='content');$('#portalsView').classList.toggle('hidden',tab.dataset.view!=='portals');}));
$('#searchInput').addEventListener('input',renderContent);
$('#newCategoryInput').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#addCategoryBtn').click(); } });
$('#assignmentList').addEventListener('change',updateAssignmentCount);
$('#contentForm').addEventListener('submit',e=>{e.preventDefault();const wasEditing=!!editingContent;const now=Date.now(),data={id:editingContent?.id||id(),title:$('#contentTitle').value.trim(),category:$('#contentCategory').value,text:$('#contentText').value.trim(),updatedAt:now};if(editingContent){state.contents=state.contents.map(c=>c.id===data.id?data:c);}else state.contents.push(data);save();$('#contentDialog').close();showToast(wasEditing?'Content updated':'Content created');});
$('#portalForm').addEventListener('submit',e=>{e.preventDefault();const wasEditing=!!editingPortal;const contentIds=[...$$('#assignmentList input:checked')].map(i=>i.value), previous=editingPortal?.synced||{}, synced={};contentIds.forEach(cid=>synced[cid]=previous[cid]||Date.now());const data={id:editingPortal?.id||id(),name:$('#portalName').value.trim(),type:$('#portalType').value,url:$('#portalUrl').value.trim(),contentIds,synced};if(editingPortal)state.portals=state.portals.map(p=>p.id===data.id?data:p);else state.portals.push(data);save();$('#portalDialog').close();showToast(wasEditing?'Portal updated':'Portal created');});
$('#importInput').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const imported=JSON.parse(await file.text());if(!Array.isArray(imported.contents)||!Array.isArray(imported.portals))throw new Error('That file does not look like SyncHub data.');state=imported;save();showToast('Data imported');}catch(error){alert(error.message);}e.target.value='';});
populateSelects();
render();
