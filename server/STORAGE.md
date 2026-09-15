# Aiven MySQL and Cloudinary

ASA keeps its Express backend and MySQL schema. New item, profile and location photos are uploaded to Cloudinary and their HTTPS URLs are saved in the existing photo columns. Existing embedded photos remain readable; none were present in the imported Aiven database during setup.

## Configuration

Use server/.env for the active server. Never commit credentials. A local fallback configuration was preserved in server/.env.local. Loading it requires an explicit dotenv override; the server does not automatically use this file.

Aiven requires DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME=asa_db, DB_SSL=true and DB_SSL_CA_PATH if its CA was supplied. Certificate paths resolve relative to server/. Certificate and hostname verification stay enabled. The imported Aiven table names are uppercase to match the SQL used by ASA. Database connections time out after 15 seconds by default.

Cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET. These are read only by the backend. No upload preset or browser-side secret is needed. Requests use the signed REST Upload API, with no additional SDK dependency.

Start with node server.js from server/. The Express server also serves the frontend.

## Files and permissions

- Photos: JPEG, PNG or WebP. Files are uploaded as public image assets because the app displays them through existing image URLs.
- Claim attachments: JPEG, PNG, WebP or PDF, at most 4 MiB. Uploaded as authenticated raw assets with random identifiers. Database metadata contains no permanent signed delivery URL.
- Claims still require written proof (1–300 characters). Student, staff and visitor forms now send the selected attachment.
- GET /api/claims/:id/attachment requires an active claimant or active admin. Authorization uses the current database role and account status. The server fetches a 60-second signed download and sends an attachment response with no-store caching.
- Admin claim tables provide a download button. The shared browser helper sends the ASA bearer token and saves the file as a download.
- Unsupported MIME types, remote upload URLs, oversized content and mismatched file signatures are rejected. These checks do not constitute malware scanning.

When an item is deleted, related claims and database records are removed in a transaction, then its Cloudinary photo and claim files are deleted. Replaced profile/location photos are removed after the database update succeeds. A failed database insert triggers removal of the new upload. If a remote deletion fails, the asset ID is logged for a manual retry; there is no background retry worker yet.

## Validation

Run node --test test/*.test.js for the upload validation tests. In environments that disallow subprocesses, use node --test --test-isolation=none test/media.test.js (Node 24).

The opt-in integration test creates temporary users, an item and PDF evidence, calls the running app, checks authorization and file deletion, then cleans up test records and uploads. Ensure the running app and test use the same database and credentials. In PowerShell:

    $env:RUN_STORAGE_INTEGRATION='1'
    node test/media.integration.cjs

Set TEST_BASE if the app is not at http://localhost:5000. Do not run this automatically against a production database. During setup, 25 integration assertions passed against Aiven/Cloudinary, and 4 validation tests passed.

## Separate email configuration

Registration still uses Brevo. Set BREVO_API_KEY and BREVO_SENDER_EMAIL to send verification messages. Cloudinary does not provide registration emails. An earlier registration attempt created a pending account before email delivery failed; that account may need verification resend after Brevo is configured.
