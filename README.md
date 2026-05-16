# ASA Lost and Found Tracker

A full-stack web application for tracking lost and found items at Caraga State University.

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: MySQL (mysql2)
- **Auth**: JWT + bcrypt + OTP email verification
- **Email**: Nodemailer (Gmail)
- **Frontend**: Vanilla HTML/CSS/JS

---

## Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### 1. Clone & Install
```bash
cd server
npm install
```

### 2. Set up MySQL database
```sql
CREATE DATABASE asa_db;
```
Import the schema (ask your DB admin for the SQL dump).

### 3. Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=asa_db
PORT=5000
JWT_SECRET=your_long_random_secret
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:5000
```

### 4. Start the server
```bash
cd server
npm start        # production
npm run dev      # development (nodemon)
```

Open `http://localhost:5000` in your browser.

---

## Deployment on Render.com

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Create a new **Web Service** on [Render.com](https://render.com)
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node server.js`
3. Add environment variables in the Render dashboard:
   - `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`
   - `JWT_SECRET` (generate a strong random string)
   - `EMAIL_USER`, `EMAIL_PASS`
   - `FRONTEND_URL` = your Render app URL (e.g., `https://asa-lost-found.onrender.com`)
   - Optional admin seed values:
     - `ADMIN_USERNAME` defaults to `ccis_admin`
     - `ADMIN_DISPLAY_NAME` defaults to `CCIS Admin`
     - `ADMIN_EMAIL` defaults to `admin@carsu.edu.ph`
     - `ADMIN_PASSWORD` defaults to `admin123`
     - `ADMIN_BOOTSTRAP_DISABLED=true` disables automatic admin seeding
4. For MySQL, use **Railway** or **PlanetScale** as your database host.

---

## Deployment on Railway.app

1. Connect your GitHub repo to [Railway.app](https://railway.app)
2. Add a **MySQL** service in the same project
3. Set environment variables under your web service settings
4. Railway auto-detects Node.js; set start command to `node server.js`

---

## Project Structure
```
ASA_FINAL/
├── client/            # Frontend (HTML/CSS/JS)
│   ├── login/         # Auth pages
│   ├── user/          # Dashboard pages (student, staff, visitor, admin)
│   ├── ASA_logo/      # Logo assets
│   ├── Picture/       # Image assets
│   └── js/            # Shared JavaScript
└── server/            # Backend
    ├── routes/        # Route handlers
    ├── server.js      # Main Express app
    ├── db.js          # MySQL pool
    └── mailer.js      # Nodemailer setup
```
