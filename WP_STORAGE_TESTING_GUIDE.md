# WordPress Storage Integration - Testing Guide

## Pre-Deployment Testing

### Environment Setup

1. **WordPress Installation**
   - Version: 5.6+ (REST API support)
   - Plugin: Question Paper PDF Generator (updated)
   - REST API: Enabled (default)

2. **React App**
   - Built with `npm run build`
   - Latest code deployed
   - API URL configured correctly

3. **Browser**
   - Clear localStorage: `localStorage.clear()`
   - Open DevTools Console
   - Open Network tab

## Test Cases

### Test 1: Create New Paper

**Steps:**
1. Open app dashboard
2. Click "নতুন প্রশ্নপত্র তৈরি করুন"
3. Fill in paper setup (subject, exam type, etc.)
4. Click "সেটআপ সংরক্ষিত হয়েছে"
5. Add a question with content
6. Click "Save" on the question

**Verify:**
- ✅ Toast shows "প্রশ্ন যোগ হয়েছে"
- ✅ Question appears in the list
- ✅ Paper appears in WordPress admin
  - Go to: Dashboard → Question Papers
  - Should see paper with title

**Check Network Tab:**
```
POST /wp-json/qpm/v1/papers → 201 Created
Response includes: "post_id": 123
```

---

### Test 2: Edit Paper

**Steps:**
1. From dashboard, click paper to edit
2. Change paper title or add question
3. Save changes

**Verify:**
- ✅ Changes saved to localStorage
- ✅ Changes saved to WordPress
- ✅ `updatedAt` timestamp updates

**Check Network Tab:**
```
PUT /wp-json/qpm/v1/papers/123 → 200 OK
```

---

### Test 3: Delete Paper

**Steps:**
1. From dashboard, click "..." menu on paper
2. Click "Delete" option
3. Confirm deletion

**Verify:**
- ✅ Toast shows "Question paper deleted"
- ✅ Paper removed from dashboard
- ✅ Paper removed from localStorage
- ✅ Paper removed from WordPress admin

**Check Network Tab:**
```
DELETE /wp-json/qpm/v1/papers/123 → 200 OK
```

---

### Test 4: Duplicate Paper

**Steps:**
1. From dashboard, click "..." menu on paper
2. Click "Duplicate" option
3. Confirm action

**Verify:**
- ✅ Toast shows "Question paper duplicated"
- ✅ New paper appears in dashboard with "(Copy)" suffix
- ✅ New paper has different ID in WordPress
- ✅ Content is identical

**Check Network Tab:**
```
POST /wp-json/qpm/v1/papers/123/duplicate → 201 Created
Response includes: "post_id": 124 (new ID)
```

---

### Test 5: Background Sync

**Steps:**
1. Create paper in WordPress directly via REST API
2. Refresh app
3. Check if paper appears in dashboard

**Verify:**
- ✅ New paper loads from localStorage first (instant)
- ✅ Background sync fetches from WordPress
- ✅ New papers merge with existing papers

**Manual API Test:**
```bash
# Create paper via curl
curl -X POST "https://ahsan.ronybormon.com/wp-json/qpm/v1/papers" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Paper",
    "data": {"setup": {"subject": "Math"}},
    "pageSettings": {}
  }'

# Should return:
# {"success": true, "post_id": 123}
```

---

### Test 6: Offline Functionality

**Steps:**
1. Create/edit paper while online
2. Open DevTools → Network → Offline
3. Try to create/edit another paper
4. Go back online
5. Check if papers sync

**Verify:**
- ✅ App continues to work offline
- ✅ Data saves to localStorage
- ✅ When online, data syncs to WordPress

**Check:**
- localStorage contains papers
- No API errors in console
- Papers sync after going online

---

### Test 7: Temporary ID to WordPress ID

**Steps:**
1. Disable WordPress storage temporarily:
   ```typescript
   // In storage.ts
   const USE_WORDPRESS = false;
   ```
2. Create a new paper
3. Note the paper ID (should be `temp-...`)
4. Re-enable WordPress:
   ```typescript
   const USE_WORDPRESS = true;
   ```
5. Save the paper
6. Check if ID changes

**Verify:**
- ✅ Initial ID is `temp-*` format
- ✅ After save to WordPress, ID becomes numeric
- ✅ Both storage systems have matching ID

---

### Test 8: Data Integrity

**Steps:**
1. Create paper with special characters
   - Subject: "ইংরেজি"
   - Questions: Include tables, formulas, special formatting
2. Save and check both storages

**Verify:**
- ✅ Data saved correctly in localStorage (raw JSON)
- ✅ Data saved correctly in WordPress (serialized JSON)
- ✅ No data corruption or loss
- ✅ Special characters render correctly

**Check:**
```bash
# In WordPress:
# Go to Database → wp_postmeta
# Check qp_data value for JSON integrity
```

---

### Test 9: Error Handling

**Steps:**
1. Disable API (change URL to invalid):
   ```typescript
   // In wpApiService.ts
   const API_BASE_URL = 'https://invalid-url.com/api';
   ```
2. Try to save a paper
3. Check error handling

**Verify:**
- ✅ Paper saves to localStorage
- ✅ Error toast appears: "Failed to save"
- ✅ App continues to work
- ✅ Console shows error details
- ✅ No app crash

---

### Test 10: Authentication (If Enabled)

**Steps:**
1. Login to app (if auth is implemented)
2. Check localStorage for `auth_token`
3. Create/edit paper
4. Check Network tab

**Verify:**
- ✅ Authorization header sent:
  ```
  Authorization: Bearer <token>
  ```
- ✅ API requests include token
- ✅ Token persists across pages

---

## API Endpoint Testing

### Get All Papers
```bash
curl -X GET "https://ahsan.ronybormon.com/wp-json/qpm/v1/papers" \
  -H "Content-Type: application/json"

# Response:
# {
#   "success": true,
#   "papers": [
#     {"id": "123", "title": "Math", ...}
#   ],
#   "total": 1
# }
```

### Get Single Paper
```bash
curl -X GET "https://ahsan.ronybormon.com/wp-json/qpm/v1/papers/123" \
  -H "Content-Type: application/json"

# Response:
# {
#   "success": true,
#   "paper": {"id": "123", "title": "Math", ...}
# }
```

### Create Paper
```bash
curl -X POST "https://ahsan.ronybormon.com/wp-json/qpm/v1/papers" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Paper",
    "data": {"setup": {"subject": "Math"}},
    "pageSettings": {}
  }'

# Response:
# {"success": true, "post_id": 123}
```

### Update Paper
```bash
curl -X PUT "https://ahsan.ronybormon.com/wp-json/qpm/v1/papers/123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Paper",
    "data": {...}
  }'

# Response:
# {"success": true, "post_id": 123}
```

### Delete Paper
```bash
curl -X DELETE "https://ahsan.ronybormon.com/wp-json/qpm/v1/papers/123" \
  -H "Content-Type: application/json"

# Response:
# {"success": true, "message": "Question paper deleted successfully"}
```

### Duplicate Paper
```bash
curl -X POST "https://ahsan.ronybormon.com/wp-json/qpm/v1/papers/123/duplicate" \
  -H "Content-Type: application/json"

# Response:
# {"success": true, "post_id": 124}
```

---

## Debugging Tools

### Browser Console Commands

```javascript
// Check papers in localStorage
console.log(JSON.parse(localStorage.getItem('bd-board-question-papers')));

// Check auth token
console.log(localStorage.getItem('auth_token'));

// Test API directly
fetch('https://ahsan.ronybormon.com/wp-json/qpm/v1/papers')
  .then(r => r.json())
  .then(d => console.log('API Response:', d));

// Monitor storage updates
const observer = new MutationObserver(() => {
  console.log('Storage updated');
});
observer.observe(document, {});
```

### DevTools Network Monitoring

1. Open DevTools → Network tab
2. Look for requests to:
   - `/wp-json/qpm/v1/papers` (GET/POST)
   - `/wp-json/qpm/v1/papers/{id}` (GET/PUT/DELETE)
3. Check:
   - Status code (200, 201, 404, etc.)
   - Response headers
   - Response body

### WordPress Debug Log

Enable in `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Check `wp-content/debug.log` for errors.

---

## Performance Testing

### Load Testing

1. Create 100+ papers
2. Measure:
   - Load time (should be <1s with localStorage)
   - API response time
   - UI responsiveness

### Network Throttling

1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Perform operations
4. Verify UI remains responsive

### Memory Usage

1. Open DevTools → Memory tab
2. Take heap snapshot before/after operations
3. Check for memory leaks

---

## Checklist Before Deployment

- [ ] All CRUD operations work
- [ ] Papers appear in WordPress admin
- [ ] Offline functionality works
- [ ] Background sync updates data
- [ ] API endpoints return correct responses
- [ ] Error handling shows messages
- [ ] No console errors
- [ ] No network errors
- [ ] localStorage data persists
- [ ] WordPress data persists
- [ ] Special characters display correctly
- [ ] Paper IDs are consistent
- [ ] Timestamps are correct
- [ ] User feedback (toast) shows correctly

---

## Common Issues & Solutions

### Issue: Papers not appearing in WordPress admin

**Solution:**
1. Check plugin is activated
2. Verify REST API is enabled
3. Check `wp-json/qpm/v1/papers` in browser
4. Check WordPress debug log

### Issue: API returns 404

**Solution:**
1. Verify endpoint URL is correct
2. Check WordPress permalink settings
3. Try flushing permalinks in WordPress
4. Verify WordPress REST API is enabled

### Issue: CORS errors

**Solution:**
1. Check plugin has CORS headers enabled
2. Verify `add_cors_headers()` in plugin
3. Check browser console for specific header errors

### Issue: Papers not syncing

**Solution:**
1. Check localStorage has papers
2. Check API response in Network tab
3. Verify `USE_WORDPRESS` is true in storage.ts
4. Check auth token if using authentication

---

## Test Report Template

```
Date: ___________
Tester: ___________
Environment: Production / Staging

Test Results:
- [ ] Create Paper: PASS / FAIL
- [ ] Edit Paper: PASS / FAIL
- [ ] Delete Paper: PASS / FAIL
- [ ] Duplicate Paper: PASS / FAIL
- [ ] Background Sync: PASS / FAIL
- [ ] Offline Mode: PASS / FAIL
- [ ] Error Handling: PASS / FAIL
- [ ] Data Integrity: PASS / FAIL
- [ ] API Endpoints: PASS / FAIL
- [ ] Performance: PASS / FAIL

Issues Found:
1. ____________
2. ____________

Sign-off: ___________
```

---

**Ready to Test!** 🚀

All systems are ready for comprehensive testing. Start with Test 1 and work through sequentially.
