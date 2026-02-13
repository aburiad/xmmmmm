# Quick Fix for 404 API Error

## What's happening?
Your React app is trying to save papers to WordPress REST API but getting a **404 (Not Found)** error. This means the WordPress plugin isn't activated on your server.

## Quick Fix (3 steps)

### 1. Upload the Plugin
- Copy the folder: `wordpress-plugin/`
- Upload it to your WordPress: `/wp-content/plugins/question-paper-pdf-generator/`

### 2. Activate the Plugin
- Go to: `https://ahsan.ronybormon.com/wp-admin/`
- Click: **Plugins** (left menu)
- Find: **Question Paper PDF Generator**
- Click: **Activate**

### 3. Test It
Open your browser console (F12 → Console) and paste:
```javascript
fetch('https://ahsan.ronybormon.com/wp-json/qpm/v1/papers')
  .then(r => r.json())
  .then(d => console.log('✅ Works!', d))
  .catch(e => console.error('❌ Error:', e));
```

**Expected result**: Should return JSON data (not an error page)

## Detailed Logs
When you save a paper now, check your browser console for messages like:
```
[Save Paper] API URL: https://ahsan.ronybormon.com/wp-json/qpm/v1/papers
[Save Paper] API available, proceeding with save
[Save Paper] Response status: 200
[Save Paper] Success! Paper ID: 123
```

If still getting 404:
```
[Save Paper] 404 Not Found - Plugin is not activated!
[Save Paper] Steps to fix:
[Save Paper]   1. Upload plugin to /wp-content/plugins/
[Save Paper]   2. Go to WordPress Admin > Plugins
[Save Paper]   3. Activate "Question Paper PDF Generator"
[Save Paper]   4. Refresh this page
```

## More Help
See: `API_404_DIAGNOSTIC.md` for detailed troubleshooting
