# WordPress Storage - Developer Quick Reference

## File Locations

```
Project Root/
├── wordpress-plugin/
│   └── includes/
│       └── class-qp-rest-api.php          ← API endpoints
│
└── src/app/
    ├── utils/
    │   ├── wpApiService.ts                ← API service (NEW)
    │   └── storage.ts                     ← Hybrid storage (UPDATED)
    │
    └── pages/
        ├── Dashboard.tsx                  ← Async operations
        ├── PaperSetup.tsx                 ← Async form
        └── QuestionBuilder.tsx            ← Async saves
```

## Usage Examples

### Load Papers (with background sync)
```typescript
import { loadPapers } from '../utils/storage';

// Loads from localStorage instantly
// Background: Syncs with WordPress
const papers = loadPapers();
```

### Save a Paper
```typescript
import { savePaper } from '../utils/storage';

// Saves to both localStorage and WordPress
await savePaper(paperObject);
toast.success('Paper saved!');
```

### Delete a Paper
```typescript
import { deletePaper } from '../utils/storage';

// Removes from both localStorage and WordPress
await deletePaper(paperId);
toast.success('Paper deleted!');
```

### Duplicate a Paper
```typescript
import { duplicatePaper } from '../utils/storage';

// Creates duplicate in both systems
const newPaper = await duplicatePaper(paperId);
if (newPaper) {
  navigate(`/builder/${newPaper.id}`);
}
```

### Direct API Calls (Advanced)
```typescript
import * as wpApi from '../utils/wpApiService';

// Get all papers from WordPress
const papers = await wpApi.fetchAllPapers();

// Get specific paper
const paper = await wpApi.fetchPaperById('123');

// Create paper
const result = await wpApi.savePaperToWordPress(
  'Math Paper',
  paperData,
  pageSettings
);

// Update paper
await wpApi.updatePaperInWordPress(
  '123',
  'Updated Title',
  paperData,
  pageSettings
);

// Delete paper
await wpApi.deletePaperFromWordPress('123');

// Duplicate paper
const newPaper = await wpApi.duplicatePaperInWordPress('123');
```

## React Component Pattern

```typescript
import { useState } from 'react';
import { savePaper, deletePaper } from '../utils/storage';
import { toast } from 'sonner';

export default function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await savePaper(paper);
      toast.success('Saved!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleSave} disabled={isLoading}>
      {isLoading ? 'Saving...' : 'Save'}
    </button>
  );
}
```

## Paper ID Types

### Temporary ID (Before Sync)
- Format: `temp-1707810000000-a1b2c3d4e`
- Used for new papers before WordPress save
- Still works with all features

### WordPress ID (After Sync)
- Format: Numeric string like `"123"`
- Assigned after first save to WordPress
- Permanent identifier

### Detection
```typescript
const isWordPressPaper = /^\d+$/.test(paperId);
const isTemporaryPaper = paperId.startsWith('temp-');
```

## API Endpoint Calls

### Direct HTTP Calls (Without Service)
```typescript
const token = localStorage.getItem('auth_token');
const headers = {
  'Content-Type': 'application/json',
};

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

// Create paper
const response = await fetch(
  'https://ahsan.ronybormon.com/wp-json/qpm/v1/papers',
  {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'My Paper',
      data: paperObject,
      pageSettings: settings
    })
  }
);

const result = await response.json();
console.log(result.post_id); // New WordPress post ID
```

## Error Handling

```typescript
import { toast } from 'sonner';

try {
  await savePaper(paper);
  toast.success('Paper saved!');
} catch (error) {
  console.error('Full error:', error);
  toast.error('Failed to save paper');
}

// The app continues to work even if API fails
// localStorage keeps data safe
```

## Configuration Changes

### Change API URL
File: `src/app/utils/wpApiService.ts` (line 3)
```typescript
const API_BASE_URL = 'https://new-domain.com/wp-json/qpm/v1';
```

### Disable WordPress Storage
File: `src/app/utils/storage.ts` (line 6)
```typescript
const USE_WORDPRESS = false; // Uses localStorage only
```

## Debugging

### Browser Console
```javascript
// Check if paper was loaded
console.log('Papers:', loadPapers());

// Check auth token
console.log('Token:', localStorage.getItem('auth_token'));

// Monitor API calls
// Check Network tab in DevTools for API requests
```

### WordPress Admin
1. Go to Dashboard → Question Papers
2. See all saved papers
3. Click paper to view meta data

### WordPress Debug Log
File: `wp-content/debug.log`
```php
// Enable in wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Common Patterns

### Async Form Submission
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await savePaper(newPaper);
    navigate('/dashboard');
  } catch (error) {
    toast.error('Save failed');
  }
};
```

### Fetch and Display
```typescript
useEffect(() => {
  const papers = loadPapers();
  setPapers(papers);
  
  // Background sync
  fetchAllPapers().then(wpPapers => {
    // Merge with local papers if needed
  });
}, []);
```

### Delete with Confirmation
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Delete paper?')) return;
  
  try {
    await deletePaper(id);
    setPapers(papers.filter(p => p.id !== id));
    toast.success('Deleted!');
  } catch (error) {
    toast.error('Delete failed');
  }
};
```

## TypeScript Types

```typescript
import { QuestionPaper, Question } from '../types';

// Paper type
const paper: QuestionPaper = {
  id: '123',
  setup: { /* ... */ },
  questions: [],
  createdAt: '2024-02-13T10:00:00Z',
  updatedAt: '2024-02-13T10:00:00Z'
};

// API Response
interface PaperResponse {
  success: boolean;
  papers?: QuestionPaper[];
  paper?: QuestionPaper;
  post_id?: string | number;
  message?: string;
}
```

## Performance Tips

1. **Don't call loadPapers() too often**
   ```typescript
   // Good
   const papers = useMemo(() => loadPapers(), []);
   
   // Avoid
   const papers = loadPapers(); // On every render
   ```

2. **Use async/await properly**
   ```typescript
   // Good
   const result = await savePaper(paper);
   
   // Avoid
   savePaper(paper); // Ignores the async result
   ```

3. **Handle loading states**
   ```typescript
   const [isLoading, setIsLoading] = useState(false);
   setIsLoading(true);
   await savePaper(paper);
   setIsLoading(false);
   ```

## Troubleshooting Code

### Check if API is working
```typescript
fetch('https://ahsan.ronybormon.com/wp-json/qpm/v1/papers')
  .then(r => r.json())
  .then(data => console.log('API works:', data))
  .catch(err => console.error('API error:', err));
```

### Check localStorage
```javascript
console.log('Papers in storage:', 
  JSON.parse(localStorage.getItem('bd-board-question-papers') || '[]')
);
```

### Check token
```javascript
console.log('Auth token:', localStorage.getItem('auth_token'));
```

## Migration Checklist

- [ ] Update `class-qp-rest-api.php` in WordPress plugin
- [ ] Deploy updated `wpApiService.ts` 
- [ ] Deploy updated `storage.ts`
- [ ] Deploy updated component files
- [ ] Rebuild React app (`npm run build`)
- [ ] Test create → edit → delete cycle
- [ ] Verify papers appear in WordPress admin
- [ ] Test offline functionality

## Important Notes

⚠️ **Critical Points:**
- Always `await` savePaper/deletePaper/duplicatePaper
- API URL must match your WordPress domain
- Auth token is optional, API works without it
- Papers are only deleted after confirmation
- Background sync is non-blocking (doesn't freeze UI)

✅ **Benefits:**
- Data survives browser cache clear
- Multi-device access
- WordPress admin integration
- Offline support
- No breaking changes to existing features

---

**Last Updated:** February 13, 2026
**Status:** Ready for Production
