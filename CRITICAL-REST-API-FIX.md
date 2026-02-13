# ⚡ CRITICAL FIX - REST API Route Registration

## The Problem
The REST API routes were registered multiple times for the same endpoint path. WordPress doesn't allow this - it causes a 404 error.

## What Was Wrong
```php
// WRONG - Registering same route twice:
register_rest_route('qpm/v1', '/papers', array(
    'methods' => 'POST',
    ...
));

register_rest_route('qpm/v1', '/papers', array(
    'methods' => 'GET',
    ...
));
```

## What Was Fixed
✅ **Fixed route registration to combine multiple methods on one route:**
```php
// RIGHT - One registration with array of methods:
register_rest_route('qpm/v1', '/papers', array(
    array(
        'methods' => 'GET',
        'callback' => array($this, 'get_papers'),
        ...
    ),
    array(
        'methods' => 'POST',
        'callback' => array($this, 'save_paper'),
        ...
    ),
));
```

✅ **Fixed save_paper to accept 'data' instead of 'questionPaper':**
```php
// React sends: { title, data, pageSettings }
// Fixed to accept: $params['data']
if (!empty($params['data'])) {
    update_post_meta($post_id, 'qp_data', wp_json_encode($params['data']));
}
```

## Files Updated
- `wordpress-plugin/includes/class-qp-rest-api.php` - FIXED route registration

## How to Apply Fix

### Option 1: Manual FTP Upload (Recommended)
1. **Download the fixed file:**
   - File: `wordpress-plugin/includes/class-qp-rest-api.php`
   - From your local project folder

2. **Upload via FTP:**
   ```
   FTP to: ahsan.ronybormon.com
   Upload: class-qp-rest-api.php
   To: /wp-content/plugins/question-paper-pdf-generator/includes/
   ```

3. **Flush WordPress Rewrite Rules:**
   - Go to: https://ahsan.ronybormon.com/wp-admin/
   - Settings → Permalinks
   - Click: Save Changes (don't change anything)

4. **Test:**
   ```javascript
   // In browser console:
   fetch('https://ahsan.ronybormon.com/wp-json/qpm/v1/papers')
     .then(r => r.json())
     .then(d => console.log('✅ Works:', d))
     .catch(e => console.error('❌ Error:', e));
   ```

### Option 2: Use Upload Helper
1. Upload `wordpress-plugin/UPDATE-PLUGIN.php` to WordPress root
2. Visit: `https://ahsan.ronybormon.com/UPDATE-PLUGIN.php`
3. Follow the instructions shown

## After Update

1. **Clear browser cache** - Ctrl+Shift+Delete
2. **Refresh React app** - Ctrl+F5
3. **Try saving a paper**
4. **Check WordPress Admin** → Posts → Question Papers (new paper should appear)
5. **Check browser console** - Should show: `[Save Paper] Success! Paper ID: XXX`

## Expected Result
```javascript
[Save Paper] Starting save operation for: My Paper
[API Check] Status: 200 Available: true
[Save Paper] API available, proceeding with save
[Save Paper] Response status: 201
[Save Paper] Success! Paper ID: 123
```

## Verification

After updating, you should be able to:
✅ Save papers from React app
✅ See papers appear in WordPress Admin
✅ Load papers from Dashboard
✅ Update papers
✅ Delete papers
✅ Duplicate papers

---

**This is the critical fix that will make the API routes work!**
