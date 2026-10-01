/* Shared admin export. Fetches complete datasets, independently of on-screen filters. */
(function (root) {
  'use strict';
  const fields = {
    summary: ['totalUsers','totalLost','totalFound','pendingClaims','resolvedItems','totalPostedItems'],
    items: ['reportCode','itemID','title','description','itemType','itemStatus','category','reporterName','reporterRole','location','locationDetail','dateOccured','createdAt','editedAt','pendingClaimID','pendingClaimantName','pendingClaimantEmail'],
    claims: ['reportCode','claimID','itemID','itemTitle','itemType','claimStatus','userName','email','role','proof','hasAttachment','pickupLocation','pickupSchedule','adminNote','createdAt'],
    users: ['userID','userName','email','role','userStatus','createdAt'],
    appeals: ['reportCode','appealID','userID','userName','role','itemID','itemTitle','itemType','itemStatus','reason','reasonCategory','reportStatus','createdAt'],
    categories: ['categoryID','categoryName'],
    locations: ['locationID','storageName','building'],
    activity: ['user','action','item','date']
  };
  function project(name, rows) {
    return rows.map(row => Object.fromEntries(fields[name].map(key => [key, row[key] ?? ''])));
  }
  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function csv(data) {
    if(Object.keys(data).length !== 1) throw new Error('Choose one dataset for CSV, or Excel for all dashboard data.');
    const tables = root.AdminReportFormat.tables(data);
    const lines = tables.length === 2
      ? [['Type', ...tables[0].headers.map(h=>h==='Last Seen Location'?'Location':h)], ...tables.flatMap(t=>t.rows.map(row=>[t.name==='Lost Items'?'Lost':'Found',...row]))]
      : [tables[0].headers,...tables[0].rows];
    return '\uFEFF' + lines.map(row => row.map(csvCell).join(',')).join('\r\n');
  }

  async function collect(selection, request) {
    const names = selection === 'all' ? Object.keys(fields) : [selection];
    const required = new Set(names);
    if (required.has('activity')) ['items','claims','appeals'].forEach(name => required.add(name));
    if (['summary','claims','appeals'].some(name=>required.has(name))) required.add('items');
    const raw = {};
    await Promise.all([...required].filter(name => name !== 'activity').map(async name => {
      raw[name] = await request(name === 'summary' ? '/admin/stats' : ['categories','locations'].includes(name) ? '/' + name : '/admin/' + name);
      if (name !== 'summary' && !Array.isArray(raw[name])) throw new Error('Unexpected export response for ' + name);
    }));
    if (raw.items) raw.items = raw.items.map(item => ({...item, reportCode: typeof root.reportCode === 'function' ? root.reportCode(item) : ''}));
    for(const name of ['claims','appeals']) if(raw[name]) raw[name]=raw[name].map(row=>({...row,reportCode:raw.items.find(item=>String(item.itemID)===String(row.itemID))?.reportCode || '—'}));
    if (raw.summary) raw.summary = [{...raw.summary, totalPostedItems: raw.items.length}];
    if (required.has('activity')) raw.activity = [
      ...raw.items.map(i => ({user:i.reporterName,action:'Submitted ' + (i.itemType === 'found' ? 'Found' : 'Lost') + ' Item',item:i.title,date:i.createdAt || i.dateOccured})),
      ...raw.claims.map(c => ({user:c.userName,action:c.claimStatus === 'approved' ? 'Approved Claim' : c.claimStatus === 'rejected' ? 'Rejected Claim' : 'Claim Request',item:c.itemTitle,date:c.createdAt})),
      ...raw.appeals.map(a => ({user:a.userName,action:'Submitted Item Report',item:a.itemTitle,date:a.createdAt}))
    ].sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
    return Object.fromEntries(names.map(name => [name, project(name, raw[name])]));
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {csvCell,csv,collect,project};
  if (!root.document) return;
  const host = document.querySelector('[data-admin-export]');
  if (!host) return;
  host.innerHTML = '<h2>Export reports</h2><p>Excel reports include formatted worksheets, a generation date, and print layouts. Choose CSV for a single dataset.</p><form class="admin-export-form"><label>Data<select name="dataset"><option value="all">All dashboard data</option><option value="summary">Summary totals</option><option value="items">Lost and found items</option><option value="claims">Claims</option><option value="users">Users</option><option value="appeals">Item reports</option><option value="activity">Activity logs</option><option value="categories">Categories</option><option value="locations">Storage locations</option></select></label><label>File format<select name="format"><option value="xlsx">Excel workbook (.xlsx)</option><option value="csv">CSV (single dataset)</option></select></label><button type="submit">Download report</button></form><p class="export-status" role="status" aria-live="polite"></p>';
  const datasetSelect=host.querySelector('[name="dataset"]'), formatSelect=host.querySelector('[name="format"]');
  function updateFormats(){formatSelect.querySelector('[value="csv"]').disabled=datasetSelect.value==='all';if(datasetSelect.value==='all')formatSelect.value='xlsx';}
  datasetSelect.addEventListener('change',updateFormats);updateFormats();
  host.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget, button = form.querySelector('button'), status = host.querySelector('.export-status');
    const selection = form.elements.dataset.value, format = form.elements.format.value;
    button.disabled = true; status.textContent = 'Preparing current records…';
    try {
      const data = await collect(selection, path => apiFetch(path));
      const generatedAt = new Date().toISOString();
      const content = format === 'csv' ? csv(data) : await root.AdminReportFormat.workbook(data, root.ExcelJS, generatedAt).xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([content], {type:format === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const link = document.createElement('a');
      link.href = url; link.download = 'asa-' + selection + '-' + generatedAt.replace(/[:.]/g,'-') + '.' + format;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      status.textContent = 'Download prepared: ' + Object.values(data).reduce((count, rows) => count + rows.length, 0) + ' records.';
    } catch (error) {
      status.textContent = 'Export failed. ' + (error.message || 'Please try again.');
    } finally { button.disabled = false; }
  });
})(typeof window === 'undefined' ? globalThis : window);
