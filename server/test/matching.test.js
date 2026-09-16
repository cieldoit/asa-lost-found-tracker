const test=require('node:test'),assert=require('node:assert/strict'),{assess}=require('../match-score');const lost={userID:1,categoryID:2,title:'Black Samsung phone',description:'Cracked screen',locationDetail:'Library',dateOccured:'2026-09-10'},found={...lost,userID:2,dateOccured:'2026-09-11'};
test('matching finds descriptive overlap',()=>assert(assess(lost,found)?.score>=70));
test('matching excludes own items and different categories',()=>{assert.equal(assess(lost,{...found,userID:1}),null);assert.equal(assess(lost,{...found,categoryID:5}),null)});
test('generic titles alone do not match',()=>assert.equal(assess({...lost,title:'Phone',description:''},{...found,title:'Phone',description:''}),null));
test('incompatible dates do not match',()=>{assert.equal(assess(lost,{...found,dateOccured:'2026-01-01'}),null);assert.equal(assess(lost,{...found,dateOccured:'invalid'}),null)});
test('different item details do not match from location alone',()=>assert.equal(assess(lost,{...found,title:'Blue backpack',description:'School bag'}),null));
