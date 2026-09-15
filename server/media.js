const crypto = require('crypto');

function config() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw Object.assign(new Error('File storage is not configured.'), { status: 503 });
  return { cloud, key, secret };
}
function sign(params, secret) {
  const value = Object.keys(params).sort().map(k => k + '=' + params[k]).join('&');
  return crypto.createHash('sha1').update(value + secret).digest('hex');
}
function parseFile(data, document = false) {
  if (typeof data !== 'string' || data.length > 6_000_000) throw Object.assign(new Error('File must be at most 4 MB.'), { status: 413 });
  const match = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data);
  if (!match || (!document && match[1] === 'application/pdf')) throw Object.assign(new Error('Choose a JPEG, PNG or WebP image' + (document ? ', or a PDF.' : '.')), { status: 400 });
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 4 * 1024 * 1024) throw Object.assign(new Error('File must be at most 4 MB.'), { status: 413 });
  const type = match[1];
  const valid = type === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : type === 'image/webp' ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
    : bytes.toString('ascii', 0, 5) === '%PDF-';
  if (!valid) throw Object.assign(new Error('File contents do not match its type.'), { status: 400 });
  return { bytes, mime: type, ext: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'application/pdf': 'pdf' }[type] };
}
async function request(resource, action, params, file) {
  const { cloud, key, secret } = config();
  const signed = { ...params, timestamp: Math.floor(Date.now() / 1000) };
  const form = new FormData();
  for (const [k, v] of Object.entries(signed)) form.append(k, String(v));
  form.append('api_key', key);
  form.append('signature', sign(signed, secret));
  if (file) form.append('file', new Blob([file.bytes], { type: file.mime }), 'upload.' + file.ext);
  const response = await fetch('https://api.cloudinary.com/v1_1/' + encodeURIComponent(cloud) + '/' + resource + '/' + action, { method: 'POST', body: form, signal: AbortSignal.timeout(30000) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error('File storage request failed. Please try again or contact the administrator.'), { status: 502 });
  return result;
}
async function upload(data, folder, document = false) {
  const file = parseFile(data, document);
  const resource = document ? 'raw' : 'image';
  const type = document ? 'authenticated' : 'upload';
  const publicId = 'asa/' + folder + '/' + crypto.randomUUID() + (document ? '.' + file.ext : '');
  const result = await request(resource, 'upload', { public_id: publicId, type, overwrite: false }, file);
  return { publicId: result.public_id, resource, type, url: document ? undefined : result.secure_url, mime: file.mime, bytes: file.bytes.length, ext: file.ext };
}
async function destroy(asset) {
  if (asset) await request(asset.resource, 'destroy', { public_id: asset.publicId, type: asset.type, invalidate: true });
}
function downloadURL(asset) {
  const { cloud, key, secret } = config();
  const params = { public_id: asset.publicId, type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + 60, attachment: true, timestamp: Math.floor(Date.now() / 1000) };
  const query = new URLSearchParams({ ...params, api_key: key, signature: sign(params, secret) });
  return 'https://api.cloudinary.com/v1_1/' + encodeURIComponent(cloud) + '/raw/download?' + query;
}
// Only a previously saved URL can be reused by the profile route.
async function photo(data, folder) {
  if (data === null || data === undefined || data === '') return null;
  return upload(data, folder);
}
function publicAsset(url) {
  if (typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com/')) return null;
  const parsed = new URL(url);
  const prefix = '/' + process.env.CLOUDINARY_CLOUD_NAME + '/image/upload/';
  if (!parsed.pathname.startsWith(prefix)) return null;
  const match = /^v[0-9]+\/(asa\/.+)\.[a-z0-9]+$/i.exec(parsed.pathname.slice(prefix.length));
  return match ? { publicId: match[1], resource: 'image', type: 'upload' } : null;
}
async function cleanup(assets) {
  for (const asset of assets.filter(Boolean)) {
    try { await destroy(asset); }
    catch { console.warn('Cloudinary cleanup needs retry for asset', asset.publicId); }
  }
}
module.exports = { parseFile, upload, destroy, downloadURL, photo, publicAsset, cleanup };
