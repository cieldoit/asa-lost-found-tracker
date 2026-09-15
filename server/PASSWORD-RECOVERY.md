# Password recovery

The login page links to /login/forgot-password.html. Active users request a reset by email, then choose a password at /login/reset-password.html. Reset links expire after 15 minutes and can be used once. Requests replace the previous token for that account.

Configure BREVO_API_KEY and BREVO_SENDER_EMAIL in server/.env. FRONTEND_URL must be the trusted website origin (HTTPS for hosted use, HTTP allowed for localhost). The current localhost origin only works on the computer running ASA. No actual recovery email was sent during verification: integration tests substitute an in-memory email sender.

The existing PASSWORD_RESETS table stores the SHA-256 hash of a random 32-byte token. The raw token is sent only in the email link fragment and removed from browser history on page load. Password updates and token consumption use a database transaction and row locks. Resetting increments USERS.authVersion; login tokens, notification requests and new realtime connections validate that version, and existing realtime streams for the user are closed. The startup migration adds authVersion with a default of zero for existing accounts.

Password rules: at least 8 characters, at most 72 UTF-8 bytes, matching confirmation in the form. Passwords are hashed using bcrypt. The account remains in its existing status; pending or suspended accounts do not receive reset links.

Requests use a generic response for known and unknown accounts. Missing global email configuration yields a service-unavailable message. Provider failures are logged without email/token details and newly created tokens are removed. Limits are in-memory per process: 3 requests per email and 10 per client IP every 15 minutes, plus 20 reset attempts per IP. For multiple server instances, replace this limiter with a shared store; reverse-proxy IP handling must be configured for your trusted hosting topology.

To run the opt-in integration checks from server/ in PowerShell:

    $env:RUN_PASSWORD_RESET_TEST='1'
    node test/password-reset.integration.cjs

This creates and removes one temporary account in the configured database, starts a temporary local HTTP server, and sends no real emails. Sixteen checks cover token hashing, password validity, expiry, replay, concurrent use, old-session rejection, throttling and delivery failure.
