const test = require('node:test');
const assert = require('node:assert/strict');
const media = require('../media');

test('untrusted upload sources and active content are rejected', () => {
  for (const value of ['https://example.com/photo.jpg', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', 'data:text/html;base64,PGgxPmhpPC9oMT4=', 'data:image/png;base64,SGVsbG8=']) {
    assert.throws(() => media.parseFile(value, true));
  }
});
test('PDF evidence is allowed, but cannot be used as a public photo', () => {
  const pdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n%%EOF').toString('base64');
  assert.equal(media.parseFile(pdf, true).mime, 'application/pdf');
  assert.throws(() => media.parseFile(pdf), { status: 400 });
});
test('attachment limit is enforced on decoded bytes', () => {
  const bytes = Buffer.alloc(4 * 1024 * 1024 + 1); bytes.write('%PDF-');
  assert.throws(() => media.parseFile('data:application/pdf;base64,' + bytes.toString('base64'), true), { status: 413 });
});
test('cleanup only recognizes public ASA images in our cloud', () => {
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  assert.equal(media.publicAsset('https://res.cloudinary.com/other/image/upload/v1/asa/items/a.png'), null);
  assert.equal(media.publicAsset('https://res.cloudinary.com/test-cloud/image/upload/v1/unrelated/a.png'), null);
  assert.equal(media.publicAsset('https://example.com/test-cloud/image/upload/v1/asa/a.png'), null);
  assert.equal(media.publicAsset('data:image/png;base64,AAAA'), null);
  assert.equal(media.publicAsset('https://res.cloudinary.com/test-cloud/image/upload/v1/asa/items/a.png').publicId, 'asa/items/a');
});
