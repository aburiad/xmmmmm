# ⚡ QUICK ACTION GUIDE - ONE FILE TO UPLOAD

## The Problem
WordPress API returning 404 because old plugin code has broken route registration.

## The Solution
Upload one fixed file - that's it!

---

## 3 Steps to Fix

### Step 1: Get the File
**Location on your computer:**
```
d:\xmpaper-generator-app\v8\wordpress-plugin\includes\class-qp-rest-api.php
```

### Step 2: Upload to Server
**Via FTP/SFTP/File Manager:**
```
Server: ahsan.ronybormon.com
Target Path: /wp-content/plugins/question-paper-pdf-generator/includes/
File: class-qp-rest-api.php
Action: OVERWRITE
```

### Step 3: Flush Cache & Test
```
1. WordPress Admin → Settings → Permalinks → Save Changes
2. Browser: Clear cache (Ctrl+Shift+Delete) + Refresh (Ctrl+F5)
3. React app: Refresh page
4. Try saving a paper
```

---

## What You Should See

**Browser Console After Fix:**
```
[API Check] Status: 200 Available: true
[Save Paper] Success! Paper ID: 123
```

**WordPress Admin:**
- Posts → Question Papers
- Your saved paper should appear!

---

## If Still Getting 404

1. Verify file uploaded to correct location
2. Check file has recent timestamp
3. Flush rewrite rules again (WordPress Admin → Permalinks → Save)
4. Clear all browser cache (Ctrl+Shift+Delete)
5. Hard refresh (Ctrl+F5)
6. Check WordPress error logs at `/wp-content/debug.log`

---

## Time Required
⏱️ **5-10 minutes total**

---

**That's literally all you need to do!** 🎉
