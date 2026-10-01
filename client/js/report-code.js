// Stable public reference: creation year + the database's unique primary key.
function reportCode(item){const date=new Date(item.createdAt);const year=Number.isNaN(date.getTime())?'--':new Intl.DateTimeFormat('en',{year:'2-digit',timeZone:'Asia/Manila'}).format(date);return (item.itemType==='lost'?'L':'F')+year+'-'+String(item.itemID).padStart(4,'0')}
window.reportCode=reportCode;

window.showReportHeader=function(data){
 const title=document.getElementById('modalTitle');if(!title)return;
 let header=document.getElementById('reportDetailHeader');if(!header){header=document.createElement('section');header.id='reportDetailHeader';header.setAttribute('aria-label','Report information');const layout=title.closest('.modal-content-layout');if(layout)layout.before(header);else title.parentElement.prepend(header)}
 let edited=document.getElementById('modalEditedStamp');if(!edited){edited=document.createElement('p');edited.id='modalEditedStamp';edited.className='detail-edited-stamp';const date=document.getElementById('modalDate');if(date)date.after(edited);else title.after(edited)}
 const editedDate=data.editedAt?new Date(data.editedAt):null;edited.hidden=!editedDate||Number.isNaN(editedDate.getTime());edited.textContent=edited.hidden?'':'Edited '+editedDate.toLocaleString();
 header.replaceChildren();for(const text of [data.reportCode?'Report ID: '+data.reportCode:'','Posted by '+(data.reporterName||'Former member'),data.finderName?'Finder: '+data.finderName:'',data.finderContact?'Contact: '+data.finderContact:'']){if(!text)continue;const line=document.createElement('div');line.textContent=text;if(text.startsWith('Report ID:'))line.style.fontWeight='700';header.append(line)}
};

window.labelStoragePhoto=function(img){
 if(!img)return;const container=img.parentElement;let label=container.querySelector('.storage-photo-label');
 if(!label){label=document.createElement('div');label.className='storage-photo-label';const title=document.createElement('strong');title.textContent='Storage location';const note=document.createElement('p');note.textContent='This photo shows where the found item is kept.';label.append(title,note);container.prepend(label)}
 img.alt='Storage location for the found item';
};
