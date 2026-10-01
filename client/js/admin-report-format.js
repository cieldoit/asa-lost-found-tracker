/* Presentation shared by Excel and CSV exports. No database/private fields are inferred. */
(function(root){
'use strict';
const titles={summary:'Summary',items:'Item Register',claims:'Claims',users:'Users',appeals:'Item Reports',activity:'Activity',categories:'Categories',locations:'Storage Locations'};
const labels={reportCode:'Report ID',title:'Item',description:'Description',itemType:'Type',itemStatus:'Item Status',category:'Category',reporterName:'Posted By',reporterRole:'Reporter Role',location:'Storage Location',locationDetail:'Location Details',dateOccured:'Date of Incident',createdAt:'Date Recorded',editedAt:'Last Edited',pendingClaimID:'Pending Claim ID',pendingClaimantName:'Pending Claimant',pendingClaimantEmail:'Claimant Email',claimID:'Claim ID',itemID:'Item Record ID',itemTitle:'Item',claimStatus:'Claim Status',userName:'Name / Username',email:'Email Address',role:'Role',proof:'Claim Details',hasAttachment:'Attachment Provided',pickupLocation:'Pickup Location',pickupSchedule:'Pickup Schedule',adminNote:'Administrator Notes',userID:'User ID',userStatus:'Account Status',appealID:'Report Record ID',reason:'Report Details',reasonCategory:'Reason',reportStatus:'Review Status',categoryID:'Category ID',categoryName:'Category',locationID:'Location ID',storageName:'Storage Location',building:'Building',user:'User',action:'Activity',item:'Item',date:'Date Recorded'};
const columns={
 items:['reportCode','title','category','itemStatus','reporterName','location','createdAt','description'],
 claims:['claimID','reportCode','itemTitle','userName','email','claimStatus','pickupLocation','pickupSchedule','proof','adminNote','createdAt'],
 users:['userID','userName','email','role','userStatus','createdAt'],
 appeals:['appealID','reportCode','itemTitle','userName','reasonCategory','reason','reportStatus','createdAt'],
 activity:['date','user','action','item'],categories:['categoryName'],locations:['storageName','building']};
const metrics={totalPostedItems:'Total Posted Items',totalLost:'Lost Item Reports',totalFound:'Found Item Reports',resolvedItems:'Resolved Items',pendingClaims:'Pending Claims',totalUsers:'Registered Users'};
function dateText(value){
 if(!value)return '—';
 const d=new Date(value); if(Number.isNaN(d.getTime()))return String(value);
 return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Manila',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}).format(d);
}
function display(key,value,row){
 if(value === null || value === undefined || value === '')return '—';
 if(['createdAt','editedAt','dateOccured','date'].includes(key))return dateText(value);
 if(key==='hasAttachment')return Number(value) ? 'Yes' : 'No';
 if(key==='itemStatus' && value==='claimed' && row.itemType==='lost')return 'Recovered';
 if(['itemType','itemStatus','claimStatus','role','reporterRole','userStatus','reasonCategory','reportStatus'].includes(key))return String(value).replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
 return value;
}
function tables(data){
 const result=[];
 for(const [name,records] of Object.entries(data)){
  if(name==='summary'){
   result.push({name:'Summary',headers:['Measure','Total'],rows:Object.entries(metrics).map(([k,label])=>[label,Number(records[0]?.[k] || 0)]),keys:['measure','total']}); continue;
  }
  const groups=name==='items' ? [['Lost Items',records.filter(r=>r.itemType==='lost')],['Found Items',records.filter(r=>r.itemType==='found')]] : [[titles[name],records]];
  for(const [title,rows] of groups){
   const keys=columns[name];
   result.push({name:title,keys,headers:keys.map(k=>k==='location' && title==='Lost Items' ? 'Last Seen Location' : labels[k]),rows:rows.map(row=>keys.map(k=>display(k,k==='location' ? (row.itemType==='lost' ? row.locationDetail || row.location : row.location || row.locationDetail) : row[k],row)))});
  }
 }
 return result;
}
function workbook(data,ExcelJS,generatedAt=new Date()){
 const book=new ExcelJS.Workbook();book.creator='ASA Lost and Found';book.created=new Date(generatedAt);book.title='ASA Administrative Report';
 const generated='Generated: '+dateText(generatedAt)+' (Philippine time)';
 for(const table of tables(data)){
  const n=table.headers.length;
  const sheet=book.addWorksheet(table.name,{views:[{state:'frozen',ySplit:5}],pageSetup:{paperSize:n>8 ? 8 : 9,orientation:n>3?'landscape':'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,margins:{left:.25,right:.25,top:.5,bottom:.5,header:.2,footer:.2}},headerFooter:{oddFooter:'ASA Lost and Found | '+table.name+' &RPage &P of &N'}});
  sheet.properties.defaultRowHeight=22;
  for(let r=1;r<=4;r++)if(n>1)sheet.mergeCells(r,1,r,n);
  sheet.getCell('A1').value='ASA LOST AND FOUND — '+table.name.toUpperCase();sheet.getRow(1).height=32;
  sheet.getCell('A1').font={name:'Calibri',size:16,bold:true,color:{argb:'FFFFFFFF'}};
  sheet.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1A5C2A'}};
  sheet.getCell('A2').value=generated;
  sheet.getCell('A3').value='Scope: All current records • '+(table.name==='Summary'?'Dashboard totals':table.rows.length+' records')+' • Screen filters not applied';
  sheet.getCell('A4').value=table.name==='Activity' ? 'Activity is derived from current item, claim and report records; dates show when records were created.' : 'Photos and attachments excluded. Blank information is shown as —.';
  sheet.getRow(4).height=30;
  for(let r=2;r<=4;r++){sheet.getCell(r,1).font={name:'Calibri',size:10,color:{argb:'FF596579'}};sheet.getCell(r,1).alignment={wrapText:true,vertical:'middle'};}
  sheet.getRow(5).values=table.headers;sheet.getRow(5).height=28;
  sheet.getRow(5).eachCell(cell=>{cell.font={name:'Calibri',bold:true,size:11,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1A5C2A'}};cell.alignment={vertical:'middle',wrapText:true};});
  table.keys.forEach((key,index)=>{sheet.getColumn(index+1).width=key==='measure'?36:key==='total'?16:/description|proof|reason$|adminNote/.test(key)?42:/location|Location|email/i.test(key)?30:/date|At$|Schedule/.test(key)?25:24;});
  table.rows.forEach((values,index)=>{
   const row=sheet.addRow(values);
   let lines=1;
   row.eachCell({includeEmpty:true},(cell,col)=>{cell.font={name:'Calibri',size:11,color:{argb:'FF263445'},bold:table.keys[col-1]==='reportCode'};cell.alignment={vertical:'top',wrapText:true};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:index%2?'FFF0F5F2':'FFFFFFFF'}};cell.border={bottom:{style:'hair',color:{argb:'FFDCE4DF'}}};lines=Math.max(lines,...String(cell.value??'').split('\n').map(line=>Math.ceil(line.length/(sheet.getColumn(col).width-2))));});
   row.height=Math.min(409,Math.max(26,lines*15+10));
  });
  if(!table.rows.length){sheet.mergeCells(6,1,6,n);sheet.getCell('A6').value='No records available.';sheet.getCell('A6').font={name:'Calibri',italic:true,size:11,color:{argb:'FF596579'}};}
  else sheet.autoFilter={from:{row:5,column:1},to:{row:5+table.rows.length,column:n}};
  sheet.pageSetup.printTitlesRow='1:5';sheet.pageSetup.printArea='A1:'+sheet.getRow(Math.max(6,sheet.rowCount)).getCell(n).address;
 }
 return book;
}
const api={tables,workbook,dateText};root.AdminReportFormat=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
