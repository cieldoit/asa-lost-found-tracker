const assert=require('node:assert/strict');
const root=require('path').resolve(__dirname, '..');
if (process.env.RUN_STORAGE_INTEGRATION !== '1') throw new Error('Set RUN_STORAGE_INTEGRATION=1 to create and remove temporary test records and Cloudinary files.');
require(root+'/node_modules/dotenv').config({path:root+'/.env',quiet:true});
if(process.env.TEST_AIVEN)require(root+'/node_modules/dotenv').config({path:root+'/.env.aiven',override:true,quiet:true});
const db=require(root+'/db'),media=require(root+'/media'),jwt=require(root+'/node_modules/jsonwebtoken');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9ioAAAAASUVORK5CYII=';
const pdf='data:application/pdf;base64,'+Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF').toString('base64');
const users=[],assets=[];let itemID,claimID;let checks=0;
const base=process.env.TEST_BASE || 'http://localhost:5000';
function check(value,message){assert.ok(value,message);checks++;console.log('PASS '+message);}
async function request(url,user,body,method='POST') {return fetch(base+url,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+jwt.sign({userID:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:'5m'})}:{})},...(body?{body:JSON.stringify(body)}:{})});}
function assetFromURL(url){const u=new URL(url);const id=u.pathname.match(/\/v\d+\/(.+)\.[^.]+$/)[1];return {publicId:id,resource:'image',type:'upload'};}
(async()=>{try{
 for(const role of ['Visitor','Visitor','Admin']){const name='media_test_'+require('crypto').randomBytes(5).toString('hex');const [r]=await db.execute("INSERT INTO USERS(userName,email,password,role,userStatus) VALUES(?,?,?,?,'active')",[name,name+'@example.invalid','unusable-test-hash',role]);users.push({id:r.insertId,role,name});}
 const [categories]=await db.query('SELECT categoryID FROM CATEGORIES LIMIT 1');
 const item={title:'Temporary storage test',description:'Integration test',dateOccured:'2026-09-13',itemType:'found',categoryID:categories[0].categoryID,locationDetail:'Test',itemPhotoData:png};
 let r=await request('/api/items/post',users[0],{...item,itemPhotoData:'data:image/png;base64,SGVsbG8='});check(r.status===400,'Reject spoofed photo bytes');
 r=await request('/api/items/post',users[0],item);let data=await r.json();check(r.status===201,'Post item with Cloudinary photo: '+JSON.stringify(data));itemID=data.itemID;
 const [items]=await db.execute('SELECT itemPhotoData FROM ITEMS WHERE itemID=?',[itemID]);const url=items[0].itemPhotoData;assets.push(assetFromURL(url));check(url.startsWith('https://res.cloudinary.com/'),'Database stores photo URL');check((await fetch(url)).ok,'Photo can be displayed');
 r=await request('/api/users/profile',users[0],{userName:users[0].name,profilePhotoData:png},'PUT');data=await r.json();check(r.ok,'Upload profile photo');assets.push(assetFromURL(data.user.profilePhotoData));
 r=await request('/api/users/profile',users[0],{userName:users[0].name,profilePhotoData:data.user.profilePhotoData},'PUT');check(r.ok,'Existing saved profile URL can be reused');
 r=await request('/api/users/profile',users[0],{userName:users[0].name,profilePhotoData:'https://attacker.invalid/a.png'},'PUT');check(r.status===400,'Reject arbitrary remote profile URLs');
 r=await request('/api/claims',users[0],{itemID,proof:'Synthetic PDF evidence',attachmentData:pdf});data=await r.json();check(r.ok,'Submit PDF claim: '+JSON.stringify(data));
 const [claims]=await db.execute('SELECT claimID,attachment FROM CLAIMS WHERE userID=? AND itemID=?',[users[0].id,itemID]);claimID=claims[0].claimID;const attachment=JSON.parse(claims[0].attachment);assets.push(attachment);check(!attachment.url,'No permanent private URL stored');
 r=await fetch('https://res.cloudinary.com/'+process.env.CLOUDINARY_CLOUD_NAME+'/raw/authenticated/'+attachment.publicId);check(!r.ok,'Cloudinary rejects unsigned document access');
 r=await request('/api/claims/'+claimID+'/attachment',null,null,'GET');check(r.status===401,'Anonymous download rejected');
 r=await request('/api/claims/'+claimID+'/attachment',users[1],null,'GET');check(r.status===403,'Other claimant rejected');
 for(const user of [users[0],users[2]]){r=await request('/api/claims/'+claimID+'/attachment',user,null,'GET');check(r.ok,'Authorized '+user.role+' download');check(r.headers.get('cache-control')==='private, no-store','Private response not cached');check((await r.text()).startsWith('%PDF-'),'PDF content preserved');}
 r=await request('/api/admin/claims',users[2],null,'GET');data=await r.json();check(data.some(c=>c.claimID===claimID&&c.hasAttachment),'Admin list marks attachment');check(!JSON.stringify(data).includes(attachment.publicId),'Admin list does not leak permanent file references');
 await db.execute("UPDATE USERS SET userStatus='suspended' WHERE userID=?",[users[0].id]);r=await request('/api/claims/'+claimID+'/attachment',users[0],null,'GET');check(r.status===403,'Suspended owner rejected despite existing token');
 r=await request('/api/items/my/'+itemID,users[1],null,'DELETE');check(r.status===404,'Other user cannot delete item');
 r=await request('/api/admin/items/'+itemID,users[2],null,'DELETE');check(r.ok,'Admin deletes item and attached evidence');
 const [remaining]=await db.execute('SELECT claimID FROM CLAIMS WHERE itemID=?',[itemID]);check(remaining.length===0,'Claim records removed with item');
 const gone=await fetch(media.downloadURL(attachment));check(!gone.ok,'Deleted claim file no longer downloads');
 console.log(checks+' integration checks passed');
}finally{
 if(itemID){await db.execute('DELETE FROM NOTIFICATIONS WHERE itemID=?',[itemID]);await db.execute('DELETE FROM CLAIMS WHERE itemID=?',[itemID]);await db.execute('DELETE FROM ITEMS WHERE itemID=?',[itemID]);}
 for(const u of users){await db.execute('DELETE FROM NOTIFICATIONS WHERE userID=?',[u.id]);await db.execute('DELETE FROM USERS WHERE userID=?',[u.id]);}
 for(const a of assets)await media.destroy(a);
 await db.end();console.log('Temporary accounts, records and files removed');
}})().catch(e=>{console.error(e.message);process.exitCode=1});
