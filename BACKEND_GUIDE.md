# Stash Backend Setup Guide

A complete, step-by-step guide to deploying the Stash cloud backup backend
on MilesWeb shared hosting using cPanel.

No prior PHP or server knowledge is required — follow each step in order.

---

## What you are building

The backend is a small PHP API that lives on your hosting server.  
The app talks to it over the internet to:

1. Register an account and verify your email with a one-time code (OTP).
2. Log in (also with OTP for security).
3. Upload a backup of your bookmarks automatically every 24 hours.
4. Download and restore that backup when you install the app on a new device.

---

## Before you start — what you need

- Your MilesWeb control panel (cPanel) login credentials.
- Your MilesWeb cPanel login credentials.
- Your subdomain is already set up: **`api.stash.slowatcoding.com`** — its folder
  (`api.stash.slowatcoding.com`) already exists in your home directory on the server.
- The `backend/` folder that is already in this project (next to this file).

---

## Step 1 — Log in to cPanel

1. Open your browser and go to `https://yourdomain.com:2083`  
   (replace `yourdomain.com` with your actual domain).
2. Enter the username and password MilesWeb gave you when you signed up.
3. You should now see the cPanel dashboard — a page full of icons.

---

## Step 2 — Create a MySQL database

Your data (users, OTP codes, backups) will be stored in a MySQL database.
Follow these steps to create one:

### 2a. Open MySQL Databases

In cPanel, scroll down and click **"MySQL Databases"**  
(it looks like a database cylinder icon).

### 2b. Create a new database

1. Under "Create New Database", type a name for your database.  
   For example: `stashdb`  
   cPanel will automatically prefix it with your account name, so it will
   actually be named something like `abhishek_stashdb`.
2. Click **"Create Database"**.
3. Note the **full database name** shown (e.g. `abhishek_stashdb`).

### 2c. Create a database user

Scroll down to "MySQL Users" → "Add New User":

1. **Username**: type `stashuser` (cPanel will prefix it, e.g., `abhishek_stashuser`).
2. **Password**: click "Password Generator" and copy the generated password somewhere safe.
3. Click **"Create User"**.

### 2d. Assign the user to the database

Scroll down to "Add User to Database":

1. Select the user you just created from the "User" dropdown.
2. Select the database you just created from the "Database" dropdown.
3. Click **"Add"**.
4. On the next screen, check **"ALL PRIVILEGES"**, then click **"Make Changes"**.

You now have a database, a user, and the user has full access to that database. ✓

---

## Step 3 — Import the database schema

The schema tells MySQL what tables to create (users, otps, backups).

### 3a. Open phpMyAdmin

Back on the cPanel main page, click **"phpMyAdmin"**.  
A new tab opens with a database management interface.

### 3b. Select your database

In the left sidebar, click on your database name (e.g. `abhishek_stashdb`).

### 3c. Import the schema

1. Click the **"Import"** tab at the top.
2. Click **"Choose File"** and select the file:
   ```
   backend/schema.sql
   ```
   (it is in the `backend/` folder inside your project).
3. Leave all other settings as-is.
4. Scroll down and click **"Go"** (or "Import").

You should see a green success message.  
In the left sidebar, you'll now see three tables: `users`, `otps`, `backups`. ✓

---

## Step 4 — Upload the backend files

You need to put the contents of the `backend/` folder onto your server.

### 4a. Where the files go

Your subdomain `api.stash.slowatcoding.com` is already created and its document
root folder (`api.stash.slowatcoding.com`) already exists in your home directory
on the server. All backend files go **directly into that folder**.

Your API will be accessible at:

```
https://api.stash.slowatcoding.com/
```

So for example the register endpoint will be at:

```
https://api.stash.slowatcoding.com/api/auth/register
```

### 4b. Open File Manager

In cPanel, click **"File Manager"**.

### 4c. Navigate to your subdomain folder

1. In the left panel you will see a list of folders. Look for
   **`api.stash.slowatcoding.com`** — it is in your home directory, at the
   same level as `public_html` (not inside it).
2. Click on it to open it. It may be empty or contain only a placeholder file.

> If you do not see it in the left panel, click the home icon (🏠) at the top
> of the left panel to go to the root of your home directory, then look again.

### 4d. Upload the files

> **Important**: You are uploading the _contents_ of `backend/`, not the
> `backend/` folder itself. The files go directly into `api.stash.slowatcoding.com/`.

The files you need to upload, with their folder structure, are:

```
api.stash.slowatcoding.com/     ← this is the folder on the server
  .htaccess                     ← this file may be hidden — see note below
  config/
    config.php
    database.php
  utils/
    jwt.php
    mailer.php
  middleware/
    auth.php
    cors.php
  api/
    auth/
      register.php
      login.php
      verify-otp.php
      resend-otp.php
      me.php
    backup/
      upload.php
      latest.php
      list.php
```

> `schema.sql` does **not** need to be uploaded — you already imported it into
> phpMyAdmin in Step 3.

**Easiest method — Upload via File Manager:**

1. Make sure you are inside `api.stash.slowatcoding.com/` in File Manager.
2. Click **"Upload"** in the toolbar.
3. Upload all files one by one, re-creating the folder structure above.
   For each subfolder (`config/`, `utils/`, etc.) you will need to create
   the folder first: click **"New Folder"**, name it, then navigate into it
   and upload the files that belong there.

**Better method — Use an FTP client (FileZilla):**

FileZilla is free and makes it easy to drag-and-drop entire folder trees at once.

1. Download FileZilla from https://filezilla-project.org (the client, not the server).
2. In cPanel → **FTP Accounts**, create a new FTP account.  
   Note the hostname (usually `ftp.slowatcoding.com`), username, and password.
3. Open FileZilla and enter those credentials at the top, then click "Quickconnect".
4. On the right panel (server side), navigate to the `api.stash.slowatcoding.com/`
   folder. It will be visible at the root of your home directory.
5. On the left panel (your computer), navigate into your project's `backend/` folder
   so you can see `.htaccess`, `config/`, `utils/`, etc.
6. Select all the files and folders on the left and drag them into the right panel.
   FileZilla will upload everything maintaining the folder structure automatically.

> **Note on `.htaccess`**: This file starts with a dot, which makes it hidden
> on Mac and Linux. In Finder, press `Cmd + Shift + .` to show hidden files.
> In FileZilla, go to **Server → Force showing hidden files**.

---

## Step 5 — Configure the backend

Now you need to tell the PHP files your database credentials and other settings.

### 5a. Edit config.php

In cPanel File Manager, navigate to `api.stash.slowatcoding.com/config/` and
click on `config.php`, then click **"Edit"** in the toolbar.

Replace the placeholder values with your real ones:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'abhishek_stashuser');  // ← your full db username
define('DB_PASS', 'the_password_you_copied_in_step_2c');
define('DB_NAME', 'abhishek_stashdb');    // ← your full db name
```

For the JWT secret, generate a random 64-character string:

1. Go to https://generate-secret.vercel.app/64 in your browser.
2. Copy the string it generates.
3. Paste it in:

```php
define('JWT_SECRET', 'paste_your_64_char_random_string_here');
```

For the email:

```php
define('FROM_EMAIL', 'noreply@yourdomain.com'); // use your actual domain
define('FROM_NAME', 'Stash App');
```

> Note: The `FROM_EMAIL` must use a domain that exists on your cPanel account,
> otherwise PHP's mail() may be rejected by spam filters. Best practice is to
> create a real email address in cPanel → "Email Accounts" first.

Click **"Save Changes"** when done.

### 5b. Verify mod_rewrite is enabled

The `.htaccess` file uses `mod_rewrite` to make clean API URLs work.
MilesWeb shared hosting has `mod_rewrite` enabled by default, so you usually
don't need to do anything. If your API returns 404 errors for all endpoints,
contact MilesWeb support and ask them to enable `mod_rewrite` for your account.

---

## Step 6 — Test the API

Before updating the app, let's verify the backend is working correctly.

### 6a. Test the server is responding

Open your browser and go to:

```
https://api.stash.slowatcoding.com/api/auth/register
```

You should see a JSON response like:

```json
{ "error": "Method not allowed" }
```

That's correct! (The browser sends a GET request, the endpoint expects POST.)
If you see a "404 Not Found" or blank page, double-check the file upload and
`.htaccess` in Step 4.

### 6b. Test registration (optional — using a REST client)

If you have an app like **Insomnia** or **Postman** installed, you can send a
real test request:

- Method: `POST`
- URL: `https://api.stash.slowatcoding.com/api/auth/register`
- Body (JSON):
  ```json
  { "email": "you@example.com", "password": "testpassword123" }
  ```
- Expected response:
  ```json
  { "message": "Account created! Check your email for a 6-digit verification code." }
  ```

---

## Step 7 — Connect the app to your backend

Now tell the app where your API lives.

### 7a. Edit lib/api.ts

Open `lib/api.ts` in your code editor (it is in the main project, not in `backend/`).

Find this line near the top:

```typescript
export const API_BASE_URL = 'https://YOUR_DOMAIN_HERE/stash-api'
```

Replace the entire value with your subdomain (no path suffix needed since the
files are at the root of the subdomain):

```typescript
export const API_BASE_URL = 'https://api.stash.slowatcoding.com'
```

Save the file.

---

## Step 8 — Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i` for the iOS
simulator / `a` for the Android emulator.

Go to the **Settings** tab in the app — you will see a new **Account** section
at the top with "Sign In" and "Create Account" buttons.

---

## How the automatic backup works

Once you are signed in:

- Every time you open the app, it checks if 24 hours have passed since the
  last backup.
- Every time you put the app in the background (switch to another app), it
  tries to upload a backup.
- If both conditions are met, a silent backup is uploaded to your server.
- The server keeps only your 5 most recent backups and discards older ones.
- No notification is shown — it happens silently in the background,
  just like WhatsApp's Google Drive backup.

When you sign in on a new device (or after reinstalling the app), the app
will detect an existing backup on the server and offer to restore it.

---

## Troubleshooting

| Problem                           | Solution                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| API returns 404 for all endpoints | Check that `.htaccess` was uploaded and that mod_rewrite is enabled                                               |
| API returns 500 error             | Check your `config.php` — incorrect database credentials cause this                                               |
| Emails are not arriving           | Check spam folder; make sure `FROM_EMAIL` uses your domain; contact MilesWeb support to confirm mail() is enabled |
| "Database connection failed"      | Double-check `DB_USER`, `DB_PASS`, `DB_NAME` in `config.php` — make sure to use the full prefixed names           |
| App can't connect to API          | Make sure `API_BASE_URL` in `lib/api.ts` is correct and your domain uses HTTPS                                    |
| OTP code is not working           | OTPs expire in 10 minutes; tap "Resend" to get a fresh code                                                       |

---

## Security notes

- The JWT secret in `config.php` is the key to your entire auth system.
  Never share it or commit it to a public repository.
- The `backend/` folder in this project is for local development reference.
  The live files are the ones inside `public_html/stash-api/` on your server.
- cPanel's File Manager is accessible only with your cPanel password, so
  your config file is protected from public access.
- All passwords are stored hashed with bcrypt — never in plain text.
- All database queries use prepared statements — no SQL injection is possible.

---

## File structure recap

```
Your project
├── backend/              ← Upload contents to public_html/stash-api/ on server
│   ├── .htaccess
│   ├── schema.sql        ← Import this once in phpMyAdmin, then not needed on server
│   ├── config/
│   │   ├── config.php    ← EDIT THIS with your credentials
│   │   └── database.php
│   ├── utils/
│   │   ├── jwt.php
│   │   └── mailer.php
│   ├── middleware/
│   │   ├── auth.php
│   │   └── cors.php
│   └── api/
│       ├── auth/
│       │   ├── register.php
│       │   ├── login.php
│       │   ├── verify-otp.php
│       │   ├── resend-otp.php
│       │   └── me.php
│       └── backup/
│           ├── upload.php
│           ├── latest.php
│           └── list.php
│
├── lib/
│   ├── api.ts            ← EDIT API_BASE_URL with your domain
│   ├── auth-context.tsx
│   ├── auth-storage.ts
│   └── sync.ts
│
└── app/
    ├── auth/
    │   ├── _layout.tsx
    │   ├── login.tsx
    │   ├── register.tsx
    │   └── otp.tsx
    └── (tabs)/
        └── settings.tsx  ← Account section added here
```
