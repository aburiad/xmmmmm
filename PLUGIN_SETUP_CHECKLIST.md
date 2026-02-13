# WordPress Plugin Setup Verification Checklist

## Before You Start
Make sure you have:
- [ ] FTP/SFTP access to ahsan.ronybormon.com
- [ ] WordPress admin access
- [ ] Plugin files from `wordpress-plugin/` folder

## Step 1: Upload Plugin Files

### Via FTP/SFTP
```
FTP Host: ahsan.ronybormon.com
Target Directory: /wp-content/plugins/

Upload the entire folder:
wordpress-plugin/ → /wp-content/plugins/question-paper-pdf-generator/
```

### File Structure Check
After upload, verify this structure exists:
```
/wp-content/plugins/question-paper-pdf-generator/
├── question-paper-pdf-generator.php
├── includes/
│   ├── class-qp-rest-api.php
│   ├── class-qp-pdf-generator.php
│   ├── class-qp-post-type.php
│   └── lib/
│       └── fpdf/ (or similar)
├── fonts/
│   ├── courier.php
│   ├── helvetica.php
│   ├── helveticab.php
│   └── helveticai.php
└── readme.txt
```

### Check Permissions
```bash
# Files should be readable and executable
chmod 755 /wp-content/plugins/question-paper-pdf-generator/
chmod 644 /wp-content/plugins/question-paper-pdf-generator/*.php
```

## Step 2: Activate Plugin

1. **Login to WordPress**
   - URL: https://ahsan.ronybormon.com/wp-admin/
   - Enter your username and password

2. **Navigate to Plugins**
   - Left sidebar → **Plugins**

3. **Find the Plugin**
   - Look for "Question Paper PDF Generator"
   - Or search for "question paper"

4. **Activate**
   - Click the **Activate** button
   - You should see: "Plugin activated successfully"

## Step 3: Check REST API Settings

1. **Go to Settings > Permalinks**
   - URL: https://ahsan.ronybormon.com/wp-admin/options-permalink.php

2. **Verify Permalink Structure**
   - ❌ Should NOT be "Plain"
   - ✅ Should be "Post name" or "Custom"

3. **If Using "Plain"**
   - Change to "Post name"
   - Click **Save Changes**

4. **Verify REST API**
   - REST API should now be enabled
   - Go to Settings > General
   - Check that "WordPress Address" and "Site Address" match

## Step 4: Test the Plugin

### Option A: Browser Console Test
1. Open your React app
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Paste and run:
```javascript
fetch('https://ahsan.ronybormon.com/wp-json/qpm/v1/papers')
  .then(r => r.json())
  .then(d => console.log('✅ SUCCESS:', d))
  .catch(e => console.error('❌ FAILED:', e));
```

### Option B: Upload Test File
1. Download `wordpress-plugin/test-plugin.php`
2. Upload to WordPress root: `https://ahsan.ronybormon.com/test-plugin.php`
3. Visit in browser: https://ahsan.ronybormon.com/test-plugin.php
4. Check results:
   - ✅ Plugin is ACTIVE
   - ✅ QP_REST_API class loaded
   - ✅ Endpoints registered

### Option C: Direct API Call
```bash
curl -X GET https://ahsan.ronybormon.com/wp-json/qpm/v1/papers
```

Expected response: JSON array (not an error page)

## Step 5: Test the React App

1. **Refresh the React app**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Refresh the page (Ctrl+F5)

2. **Try Creating a Paper**
   - Go to Dashboard
   - Create a new paper
   - Try to save it
   - Open browser console (F12)

3. **Check Console Output**
   - Look for: `[Save Paper] Success! Paper ID: 123`
   - Or error: `[Save Paper] 404 Not Found - Plugin is not activated!`

## Troubleshooting

### Issue: Still Getting 404 Error

**Check 1: Plugin Folder Exists**
```bash
ls -la /wp-content/plugins/question-paper-pdf-generator/
```
If folder doesn't exist → Upload it again via FTP

**Check 2: Plugin is Activated**
- Go to https://ahsan.ronybormon.com/wp-admin/plugins.php
- Look for "Question Paper PDF Generator"
- If it shows "Activate" → Click it
- If it shows "Deactivate" → Plugin is active (good!)

**Check 3: WordPress Error Log**
```bash
tail -f /wp-content/debug.log
```
Look for PHP errors related to the plugin

**Check 4: PHP Version**
```bash
php -v
```
Must be PHP 7.4 or higher. Check in WordPress Admin > Tools > Site Health if available.

**Check 5: REST API Permalink Issue**
- Go to Settings > Permalinks
- Change from "Plain" to "Post name"
- Save
- Try API test again

**Check 6: File Permissions**
```bash
# Change ownership if needed
chown www-data:www-data /wp-content/plugins/question-paper-pdf-generator/ -R

# Ensure readable
chmod 755 /wp-content/plugins/question-paper-pdf-generator/ -R
chmod 644 /wp-content/plugins/question-paper-pdf-generator/*.php -R
```

### Issue: Plugin Activates But 404 Persists

**Possible Causes:**
1. Main plugin file `question-paper-pdf-generator.php` has syntax error
2. REST API routes not registering (check `class-qp-rest-api.php`)
3. WordPress namespace conflict

**Debug Steps:**
1. Enable WordPress debug mode in `wp-config.php`:
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_DISPLAY', false);
   define('WP_DEBUG_LOG', true);
   ```

2. Check logs: `/wp-content/debug.log`

3. Look for errors like:
   - "Cannot redeclare function"
   - "Class not found"
   - "Syntax error"

### Issue: Class Not Found / Fatal Error

**Check file includes** in `question-paper-pdf-generator.php`:
```php
require_once plugin_dir_path(__FILE__) . 'includes/class-qp-rest-api.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-qp-post-type.php';
require_once plugin_dir_path(__FILE__) . 'includes/class-qp-pdf-generator.php';
```

All these files must exist and be in the correct location.

## Success Indicators

When everything is working:
- [ ] Plugin shows as "Active" in WordPress Admin
- [ ] REST API call returns JSON (not 404)
- [ ] Browser console shows `[Save Paper] Success!`
- [ ] Papers appear in Dashboard
- [ ] Papers persist after refresh
- [ ] Papers remain even after clearing localStorage

## Files to Keep

Keep these files in your project:
- `wordpress-plugin/` folder → Upload to WordPress
- `src/app/utils/storage.ts` → React storage layer
- `src/app/utils/wpApiService.ts` → API communication
- `src/app/pages/Dashboard.tsx` → Paper management UI

## Getting Help

If you're stuck:
1. Check `API_404_DIAGNOSTIC.md` for detailed debugging
2. Check `STORAGE_STATUS_AND_DEBUG.md` for architecture
3. Review error logs in WordPress
4. Check browser console for detailed error messages
