(() => {
 const pending={};
 async function get(type){if(!pending[type])pending[type]=apiFetch('/items/reserve',{method:'POST',body:JSON.stringify({itemType:type})}).catch(e=>{delete pending[type];throw e});return pending[type]}
 window.ReportReservation={get,clear(type){delete pending[type];show(type)}};
 async function show(type){const box=document.getElementById(type+'ReportReference');if(!box)return;box.textContent='Reserving report ID…';try{const data=await get(type);box.textContent='Report ID: '+data.reportCode;}catch{box.replaceChildren(document.createTextNode('Unable to reserve an ID. '));const retry=document.createElement('button');retry.type='button';retry.textContent='Retry';retry.onclick=()=>show(type);box.append(retry)}}
 for(const type of ['lost','found']){const input=document.getElementById(type+'Title');if(!input)continue;const box=document.createElement('div');box.id=type+'ReportReference';box.setAttribute('role','status');box.style.cssText='padding:12px 16px;margin-bottom:20px;background:#e8f5ed;color:#1a5c2a;border-radius:10px;font-weight:600';const group=input.closest('.form-group');(input.closest('.form-card')||group.parentElement).prepend(box);const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){show(type);observer.disconnect()}});observer.observe(box)}
})();
