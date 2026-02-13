# API 404 Error - Diagnostic Guide

## Problem
When attempting to save a paper, you're seeing:
```
POST https://ahsan.ronybormon.com/wp-json/qpm/v1/papers 404 (Not Found)
```

## Root Cause
The WordPress REST API endpoint returns **404 Not Found**, which means **the WordPress plugin is not activated or properly deployed** on the server.

## What We Know
- ✅ React code is correct
- ✅ API service functions are correctly configured
- ✅ WordPress plugin code is correctly implemented
- ❌ Plugin is NOT activated/accessible on the server

## Step-by-Step Fix

### Step 1: Verify Plugin Deployment
1. Upload the WordPress plugin folder to your WordPress installation:
   - **Location**: `/wp-content/plugins/question-paper-pdf-generator/`
   - **Main file**: `question-paper-pdf-generator.php`

2. The folder should contain:
   ```
   question-paper-pdf-generator/
   ├── question-paper-pdf-generator.php  (main plugin file)
   ├── includes/
   │   ├── class-qp-rest-api.php        (REST API endpoints)
   │   ├── class-qp-pdf-generator.php
   │   ├── class-qp-post-type.php
   │   └── lib/
   ├── fonts/
   │   ├── courier.php
   │   └── helvetica*.php
   └── [other files]
   ```

### Step 2: Activate the Plugin
1. Go to **WordPress Admin Dashboard**
2. Navigate to **Plugins**
3. Find "Question Paper PDF Generator"
4. Click **Activate**

### Step 3: Test the Plugin

#### Option A: Use Browser Console
Open your browser's Developer Tools (F12) and run:
```javascript
// Test if API is available
fetch('https://ahsan.ronybormon.com/wp-json/qpm/v1/papers')
  .then(r => r.json())
  .then(d => console.log('✅ API Works:', d))
  .catch(e => console.error('❌ API Error:', e));
```

Expected response: Should either return papers array or a proper JSON response (not 404)

#### Option B: Use the Test File
1. Upload `wordpress-plugin/test-plugin.php` to the WordPress root
2. Visit: `https://ahsan.ronybormon.com/test-plugin.php`
3. Check the results:
   - ✅ Plugin is ACTIVE
   - ✅ QP_REST_API class loaded
   - ✅ REST API endpoint accessible

### Step 4: Verify REST API is Enabled

1. In WordPress Admin, go to **Settings > Permalinks**
2. Ensure you're NOT using "Plain" permalinks
3. Select "Post name" or another option
4. Click **Save Changes**

### Step 5: Check CORS (if React is on different domain)

If your React app is on a different domain than WordPress, ensure CORS is enabled:

In `question-paper-pdf-generator.php`, add to the plugin load section:
```php
// Allow CORS
add_action('rest_api_init', function() {
    remove_filter('rest_pre_echo_response', 'rest_send_cors_headers');
    add_filter('rest_pre_echo_response', 'rest_send_cors_headers', 0);
    
    // Also ensure credentials are sent
    header('Access-Control-Allow-Credentials: true');
}, 15);
```

## Browser Console Debugging

When you get the 404 error, check the browser console for messages like:

```
[Storage Debug] Saving new paper to WordPress: My School Name
[Storage Debug] Save result: {
  success: false,
  error: "HTTP error! status: 404",
  id: null
}
```

This confirms the API endpoint is not accessible.

## Quick Checklist

- [ ] Plugin folder uploaded to `/wp-content/plugins/`
- [ ] Plugin is **ACTIVE** in WordPress Admin > Plugins
- [ ] Permalinks are NOT set to "Plain"
- [ ] REST API is enabled (check with test-plugin.php)
- [ ] Browser console shows successful API responses
- [ ] CORS configured if React and WordPress on different domains

## If Still Getting 404

1. **Check WordPress error logs** in `/wp-content/debug.log`
2. **Verify namespace** in code:
   - Namespace should be: `qpm/v1`
   - Endpoint should be: `/papers`
   - Full URL: `https://ahsan.ronybormon.com/wp-json/qpm/v1/papers`

3. **Test with curl** from terminal:
   ```bash
   curl -X GET https://ahsan.ronybormon.com/wp-json/qpm/v1/papers
   ```
   This should return JSON, not an error page

4. **Check PHP version** - Plugin requires PHP 7.4+

## Once Fixed

Once the plugin is activated and working:
1. The 404 error should disappear
2. Papers will save to WordPress
3. Papers persist even when localStorage is cleared
4. Dashboard will load papers from WordPress on startup

## Questions?

If you're still having issues:
1. Share the output from `test-plugin.php`
2. Check WordPress error logs
3. Verify plugin folder structure matches above
4. Ensure permissions are correct on plugin files
