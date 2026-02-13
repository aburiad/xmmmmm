# WordPress Storage Deployment & Setup Guide

## Quick Start

### Step 1: Update WordPress Plugin

1. Navigate to `wordpress-plugin/` directory
2. Ensure the updated `includes/class-qp-rest-api.php` is in place
3. Zip the plugin folder
4. Upload to WordPress as a plugin update
5. Activate the plugin

### Step 2: Deploy React App

1. Update API endpoint in `src/app/utils/wpApiService.ts` if needed:
```typescript
const API_BASE_URL = 'https://your-wordpress-domain.com/wp-json/qpm/v1';
```

2. Build the React app:
```bash
npm run build
```

3. Deploy the `dist/` folder to your hosting

### Step 3: Enable WordPress REST API (If Needed)

Most WordPress installations have REST API enabled by default. To verify:

1. Access `https://your-domain.com/wp-json/wp/v2/` in browser
2. Should show JSON response with WordPress version

### Step 4: Test the Integration

1. Open React app
2. Create a new question paper
3. Check WordPress admin → Question Papers
4. Verify paper appears there

## Installation Details

### WordPress Plugin Files to Update

**File:** `wordpress-plugin/includes/class-qp-rest-api.php`

The following NEW endpoints have been added:
- `GET /papers/{id}` - Get single paper with full data
- `PUT /papers/{id}` - Update paper
- `DELETE /papers/{id}` - Delete paper
- `POST /papers/{id}/duplicate` - Duplicate paper

### React Files Modified

1. **`src/app/utils/wpApiService.ts`** (NEW)
   - Complete API service layer
   - All functions to communicate with WordPress

2. **`src/app/utils/storage.ts`** (UPDATED)
   - Now async functions
   - Hybrid localStorage + WordPress storage
   - Background sync support

3. **`src/app/pages/Dashboard.tsx`** (UPDATED)
   - Handles async delete/duplicate
   - Loading states
   - Error handling

4. **`src/app/pages/PaperSetup.tsx`** (UPDATED)
   - Async form submission
   - Better error handling

5. **`src/app/pages/QuestionBuilder.tsx`** (UPDATED)
   - Async save operations
   - Better toast notifications

## Database Schema

### WordPress Custom Post Type: `question_paper`

```
Post Type: question_paper
Status: publish
Author: Current user

Meta Fields:
- qp_data (serialized JSON): Full paper object
- qp_page_settings (serialized JSON): Page settings
- qp_pdf_url (string): URL to generated PDF
- qp_pdf_generated_at (string): PDF generation timestamp
```

## API Configuration

### Base URL

Default: `https://ahsan.ronybormon.com/wp-json/qpm/v1`

To change, edit `src/app/utils/wpApiService.ts`:
```typescript
const API_BASE_URL = 'YOUR_NEW_URL';
```

### Headers Sent

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>' // If auth_token in localStorage
}
```

## Data Structure

### Paper Object in WordPress

```json
{
  "id": "123",
  "title": "Mathematics - Class Test",
  "createdAt": "2024-02-13T10:00:00Z",
  "updatedAt": "2024-02-13T10:30:00Z",
  "data": {
    "id": "123",
    "setup": {
      "subject": "গণিত",
      "examType": "class-test",
      "schoolName": "ABC School",
      "date": "2024-02-13",
      "timeMinutes": 60,
      "totalMarks": 100
    },
    "questions": [
      {
        "id": "q1",
        "number": 1,
        "type": "mcq",
        "blocks": [
          {
            "type": "text",
            "content": "Question text"
          }
        ],
        "marks": 5
      }
    ]
  },
  "pageSettings": {
    "fontSize": 12,
    "fontFamily": "Arial",
    "paperSize": "A4"
  }
}
```

## Synchronization Logic

### Load (Read) Flow

```
1. Load from localStorage (fast access)
2. Background: Fetch from WordPress
3. Merge papers (local takes priority)
4. Update localStorage if needed
```

### Save (Write) Flow

```
1. Save to localStorage immediately
2. If paper has WordPress ID: UPDATE in WordPress
3. If paper is new: CREATE in WordPress, get new ID
4. Update paper ID in localStorage
```

### Delete (Write) Flow

```
1. Remove from localStorage
2. If paper has WordPress ID: DELETE from WordPress
3. Handle errors gracefully
```

## Environment Variables

No environment variables needed. All config is in the code:

- API URL: `src/app/utils/wpApiService.ts` (line 3)
- Storage toggle: `src/app/utils/storage.ts` (line 6)
- Auth token key: `'auth_token'` in localStorage

## Performance Optimization

### Tips for Optimal Performance

1. **Background Sync:** Set to run after component mount
   ```typescript
   // In storage.ts loadPapers()
   setTimeout(() => syncWithWordPress(), 1000);
   ```

2. **Batch Operations:** Save multiple papers together
   ```typescript
   const papers = [...existing];
   papers.push(newPaper);
   await savePapers(papers);
   ```

3. **Caching:** Implement in-memory cache
   ```typescript
   let paperCache: QuestionPaper[] | null = null;
   ```

## Troubleshooting

### Issue: "Papers not saving to WordPress"

**Solution:**
1. Check API URL in `wpApiService.ts`
2. Verify WordPress REST API is accessible
3. Check browser console for errors
4. Verify WordPress plugin is active

### Issue: "CORS errors"

**Solution:**
1. WordPress needs proper CORS headers
2. Check plugin `add_cors_headers()` in `class-qp-rest-api.php`
3. Verify plugin is activated

### Issue: "404 on API endpoints"

**Solution:**
1. Verify WordPress REST API is enabled
2. Check WordPress version (needs 4.7+)
3. Verify plugin is activated
4. Flush WordPress permalinks (Settings → Permalinks → Save)

### Issue: "Papers showing as temp- IDs"

**Solution:**
1. These are temporary local papers
2. Will get WordPress ID after successful save
3. Check browser console for API errors
4. Verify API endpoint is accessible

## Monitoring & Logging

### Browser Console

Watch for messages like:
```
📥 Loaded Table from Paper1 Q1 Block1: {...}
📊 Saving Table in Q1 Block1: {...}
API Error: ...
Background sync error: ...
```

### WordPress Logs

Enable WordPress debug logging in `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Check `/wp-content/debug.log` for API errors.

## Rollback Plan

If you need to revert to localStorage only:

1. In `src/app/utils/storage.ts`, change:
```typescript
const USE_WORDPRESS = false; // Changed from true
```

2. Rebuild and redeploy React app

3. All existing localStorage data remains intact

## Migration from Pure LocalStorage

If you had a previous version using only localStorage:

1. Install updated plugin on WordPress
2. Deploy new React code
3. Users' localStorage data is automatically loaded
4. On first save, data syncs to WordPress
5. Paper IDs update from temp-* to numeric WordPress IDs

No data loss occurs during migration.

## Security Notes

- API endpoints are public (no auth required by default)
- To add authentication:
  1. Store auth token in localStorage
  2. Tokens are automatically sent in Authorization header
  3. Implement token verification in WordPress

- Paper data is stored in WordPress post meta
- Posts are "publish" status (visible in admin)
- Implement user/role-based access control if needed

## File Checklist

Before deployment, verify these files are updated:

- [ ] `wordpress-plugin/includes/class-qp-rest-api.php` - Updated endpoints
- [ ] `src/app/utils/wpApiService.ts` - New API service
- [ ] `src/app/utils/storage.ts` - Hybrid storage
- [ ] `src/app/pages/Dashboard.tsx` - Async operations
- [ ] `src/app/pages/PaperSetup.tsx` - Async form
- [ ] `src/app/pages/QuestionBuilder.tsx` - Async saves

## Support

For issues or questions:

1. Check console errors in browser DevTools
2. Check WordPress debug.log
3. Verify API endpoints are accessible
4. Check WordPress plugin is activated and updated
