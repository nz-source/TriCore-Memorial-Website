# TriCore Memorial Website (React + PHP + MySQL on WAMP)

```
tricore-memorial/
  database/schema.sql   MySQL tables + sample data + default administrator
  backend/              PHP REST API (copy to C:\wamp64\www\tricore-api)
  frontend/             React (Vite) website and admin dashboard
```

## 1. Database (WAMP / phpMyAdmin)
1. Start WAMP (icon must be green).
2. Open http://localhost/phpmyadmin, go to **Import**, choose `database/schema.sql`, click **Import**.
   This creates the `tricore_memorial` database, the tables, five sample memorials and one administrator.

## 2. PHP backend
1. Copy the `backend` folder to `C:\wamp64\www\tricore-api` (so `index.php` is at `www\tricore-api\index.php`).
2. Open `config.php` and check the database user and password (WAMP default: user `root`, empty password).
3. Make sure Apache `rewrite_module` is on (WAMP icon > Apache > Apache modules > rewrite_module) and restart WAMP.
4. In `php.ini` (WAMP icon > PHP > php.ini) set `upload_max_filesize = 5M` and `post_max_size = 16M`, then restart WAMP. Otherwise photo uploads over 2 MB fail.
5. Test: open http://localhost/tricore-api/settings. You should see JSON with the site name.

## 3. React frontend
Requires Node.js 18 or newer.
```
cd frontend
copy .env.example .env        (macOS/Linux: cp .env.example .env)
npm install
npm run dev
```
Open http://localhost:5173.

To publish inside WAMP instead: run `npm run build`, copy everything inside `frontend/dist` to `C:\wamp64\www\tricore`, and open http://localhost/tricore/. If your site uses another address, add it to `origins` in `backend/config.php`.

## 4. Log in
Administrator: `admin@tricore.local` / `admin123`. **Change this password straight away**: create a new administrator under User Management, log in as that account, and delete the default one.

Only administrators have accounts. Visitors browse, light candles, send prayers and share memories without registering. Memories wait for approval in Memory Wall.

## What the administrator can do
Dashboard, Memorial Management (add, edit, delete, save draft or publish), **Wake & Funeral** (edit each memorial's wake date, hours, location, church, funeral date and time, presider; clear a schedule; delete a memorial), Cemetery Management, Gallery Management, Memory Wall approvals, Prayers & Candles moderation, Guest Management, User Management, Privacy & Security, Reports and Settings (site name, headline, footer quote).

Cemetery type (catholic, private, public) and visibility (public, private) are separate fields. A Catholic cemetery memorial can be public or private.

## API summary
| Method and path | Who | Purpose |
|---|---|---|
| POST /auth/login, /auth/logout, GET /auth/me | all | Session login |
| GET /memorials?q=&type= , GET /memorials/{id} | visitors | Browse (private ones are locked) |
| POST /memorials/{id}/candles, /prayers, /memories | visitors | Tributes (memories need approval) |
| GET /tributes, GET /settings, POST /contact | visitors | Walls, site text, contact form |
| GET /admin/stats, /admin/memorials, /admin/content | admin | Dashboard data |
| POST /memorials, POST /memorials/{id}, DELETE /memorials/{id} | admin | Add, update, delete |
| PUT or DELETE /memorials/{id}/schedule | admin | Set or clear wake and funeral schedule |
| PUT /memorials/{id}/privacy | admin | Visibility and guest permissions |
| POST /memorials/{id}/gallery, DELETE /gallery/{id} | admin | Photos |
| PUT or DELETE /memories/{id}, DELETE /candles/{id}, /prayers/{id}, /messages/{id} | admin | Moderation |
| GET, POST /users, DELETE /users/{id}, PUT /settings | admin | Accounts and settings |

## Security built in
Prepared SQL statements, bcrypt password hashes, session cookies (HttpOnly, SameSite Lax), CORS limited to the origins in `config.php`, image uploads checked by real file type and renamed, scripts blocked in `uploads/`, admin checks on every write route, and React escapes all visitor text.

Before going live on the internet: use HTTPS, set the session cookie `secure` flag in `startSession()` in `helpers.php`, change the default password, restrict `origins`, and back up the database.

## Troubleshooting
- **"Failed to fetch" or CORS error:** the page address must be listed in `origins` in `config.php`, and `VITE_API_URL` in `.env` must match your API folder (restart `npm run dev` after editing).
- **404 on every API call:** `rewrite_module` is off, or Apache ignores `.htaccess` (WAMP: set `AllowOverride All` for `www`).
- **Database error:** check `config.php` and that `schema.sql` was imported.
- **Images do not show:** open http://localhost/tricore-api/uploads/ and check the folder is writable.
