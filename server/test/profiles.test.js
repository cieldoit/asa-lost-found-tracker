const test=require('node:test');const assert=require('node:assert/strict');const express=require('express');
test('profile privacy guards and settings ownership',async()=>{
 const dbPath=require.resolve('../db');const original=require.cache[dbPath];let active=true,showRole=0,timeline='none',writes=[];
 require.cache[dbPath]={id:dbPath,filename:dbPath,loaded:true,exports:{execute:async(sql,args)=>{
 if(sql.startsWith('SELECT userID FROM USERS'))return [active?[{userID:1}]:[]];
 if(sql.startsWith('SELECT showRole'))return [[]];
 if(sql.startsWith('INSERT INTO PROFILE_PRIVACY')){writes.push(args);return [{}]}
 if(sql.includes('COALESCE(p.showRole'))return [[{userID:2,userName:'Member',role:'Visitor',profilePhotoData:null,showRole:showRole,timeline}]];
 if(sql.includes('FROM ITEMS'))throw Error('Private timeline must not query items');
 throw Error('Unexpected query');}}};
 const modulePath=require.resolve('../routes/profiles');delete require.cache[modulePath];const {router}=require(modulePath);const app=express();app.use(express.json());app.use((req,res,next)=>{req.user={userID:1};next()});app.use(router);const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port;
 try{
 let r=await fetch(url+'/2');assert.equal(r.status,200);assert.equal((await r.json()).user.role,undefined);
 showRole=1;r=await fetch(url+'/2');let body=await r.json();assert.equal(r.status,200);assert.equal(body.timelineVisible,false);assert.deepEqual(body.posts,[]);assert.equal(body.user.email,undefined);assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal(body.user.role,'Visitor');showRole=0;r=await fetch(url+'/2');assert.equal(r.status,200);assert.equal((await r.json()).user.role,undefined);
 r=await fetch(url+'/settings');assert.deepEqual(await r.json(),{showRole:0,timeline:'none'});
 r=await fetch(url+'/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({userID:2,showRole:true,timeline:'lost'})});assert.equal(r.status,200);assert.deepEqual(writes[0],[1,true,'lost']);
 r=await fetch(url+'/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({showRole:true,timeline:'invalid'})});assert.equal(r.status,400);assert.equal(writes.length,1);
 active=false;assert.equal((await fetch(url+'/2')).status,403);
 }finally{await new Promise(r=>server.close(r));if(original)require.cache[dbPath]=original;else delete require.cache[dbPath];delete require.cache[modulePath]}
});
