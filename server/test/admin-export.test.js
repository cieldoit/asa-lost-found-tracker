const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const context = {module:{exports:{}}};
new Function('module', fs.readFileSync(require('node:path').join(__dirname,'../../client/js/admin-report-format.js'),'utf8'))(context.module);
new Function('module', fs.readFileSync(require('node:path').join(__dirname,'../../client/js/admin-export.js'),'utf8'))(context.module);
const {csvCell,csv,collect,project} = context.module.exports;
test('CSV escapes quotes, newlines, Unicode and spreadsheet formulas', () => {
 assert.equal(csvCell('a,"b"'), '"a,""b"""');
 for (const value of ['=1+1',' +SUM(A1)','@cmd','-2','\tvalue']) assert.ok(csvCell(value).startsWith('"\''));
 const result=csv({users:project('users',[{userName:'José\nReyes',password:'secret'}])});
 assert.ok(result.startsWith('\uFEFF')); assert.ok(result.includes('José\nReyes')); assert.ok(!result.includes('secret'));
});
test('all exports include empty datasets, current summary and allowlisted records', async () => {
 const data=await collect('all', async path => path === '/admin/stats' ? {totalUsers:2} : path === '/admin/items' ? [{itemID:1,title:'Wallet',itemType:'lost',itemPhotoData:'private-image'}] : []);
 assert.equal(data.summary[0].totalPostedItems,1);
 assert.equal(data.items.length,1); assert.equal(data.activity.length,1);
 assert.equal(data.claims.length,0); assert.equal(data.items[0].itemPhotoData,undefined);
 assert.ok(csv({claims:[]}).includes('Claim ID'));
});
test('failure aborts export rather than silently omitting records', async () => {
 await assert.rejects(collect('all', async () => {throw new Error('Unauthorized');}), /Unauthorized/);
 await assert.rejects(collect('users', async () => ({})), /Unexpected/);
});

test('Excel workbook separates registers and preserves safe text, readable dates and numbers', async () => {
 const ExcelJS=require('exceljs');
 const book=globalThis.AdminReportFormat.workbook({summary:[{totalLost:1,totalFound:1,totalPostedItems:2}],items:[{reportCode:'L26-0025',itemType:'lost',title:'=1+1',itemStatus:'claimed',createdAt:'2026-09-25T00:00:00Z',description:'Long description '.repeat(20)},{reportCode:'F26-0026',itemType:'found',title:'Keys'}],claims:[]},ExcelJS,new Date('2026-09-25T00:00:00Z'));
 const bytes=await book.xlsx.writeBuffer();
 const loaded=new ExcelJS.Workbook();await loaded.xlsx.load(bytes);
 assert.deepEqual(loaded.worksheets.map(s=>s.name),['Summary','Lost Items','Found Items','Claims']);
 assert.equal(loaded.getWorksheet('Summary').getCell('B6').value,2);
 const lost=loaded.getWorksheet('Lost Items');
 assert.equal(lost.getCell('B6').value,'=1+1');assert.equal(lost.getCell('B6').type,ExcelJS.ValueType.String);
 assert.equal(lost.getCell('D6').value,'Recovered');assert.match(lost.getCell('G6').value,/25 Sept 2026.*08:00/i);
 assert.equal(lost.views[0].ySplit,5);assert.equal(lost.pageSetup.fitToWidth,1);assert.ok(lost.getRow(6).height>26);
 assert.equal(loaded.getWorksheet('Claims').getCell('A6').value,'No records available.');
});
test('CSV has friendly headings and rejects mixed datasets',()=>{
 assert.throws(()=>csv({users:[],claims:[]}),/one dataset/);
 assert.ok(csv({items:[]}).includes('Report ID'));
 assert.ok(!csv({items:[]}).includes('Dataset'));
});
