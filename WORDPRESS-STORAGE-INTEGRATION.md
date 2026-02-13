# WordPress Storage Integration Guide

## Overview

This document describes the migration from localStorage-only storage to a hybrid system where the React app synchronizes data with WordPress via REST API while maintaining localStorage as a fallback.

## Architecture

### Components

1. **WordPress REST API Endpoints** - Backend CRUD operations for question papers
2. **React Storage Service** - Hybrid storage using both localStorage and WordPress API
3. **API Service Layer** - `wpApiService.ts` - Handles all API communication
4. **React Components** - Updated to handle async operations

## WordPress REST API Endpoints

Base URL: `https://ahsan.ronybormon.com/wp-json/qpm/v1`

### Endpoints

#### 1. Get All Papers
- **URL:** `/papers`
- **Method:** `GET`
- **Auth:** Optional (Bearer token)
- **Response:**
```json
{
  "success": true,
  "papers": [
    {
      "id": "123",
      "title": "Math Question Paper",
      "createdAt": "2024-02-13T10:00:00Z",
      "updatedAt": "2024-02-13T10:00:00Z",
      "data": { /* full paper object */ },
      "pageSettings": { /* page settings */ },
      "pdf_url": "https://...",
      "has_pdf": true
    }
  ],
  "total": 1
}
```

#### 2. Get Single Paper
- **URL:** `/papers/{id}`
- **Method:** `GET`
- **Auth:** Optional
- **Response:**
```json
{
  "success": true,
  "paper": {
    "id": "123",
    "title": "Math Question Paper",
    "createdAt": "2024-02-13T10:00:00Z",
    "updatedAt": "2024-02-13T10:00:00Z",
    "data": { /* full paper object */ },
    "pageSettings": { /* page settings */ },
    "pdf_url": "https://..."
  }
}
```

#### 3. Create Paper
- **URL:** `/papers`
- **Method:** `POST`
- **Auth:** Optional
- **Request Body:**
```json
{
  "title": "Math Question Paper",
  "data": { /* full paper object */ },
  "pageSettings": { /* page settings */ }
}
```
- **Response:**
```json
{
  "success": true,
  "post_id": 123,
  "message": "Question paper saved successfully"
}
```

#### 4. Update Paper
- **URL:** `/papers/{id}`
- **Method:** `PUT`
- **Auth:** Optional
- **Request Body:**
```json
{
  "title": "Updated Title",
  "data": { /* full paper object */ },
  "pageSettings": { /* page settings */ }
}
```
- **Response:**
```json
{
  "success": true,
  "post_id": 123,
  "message": "Question paper updated successfully"
}
```

#### 5. Delete Paper
- **URL:** `/papers/{id}`
- **Method:** `DELETE`
- **Auth:** Optional
- **Response:**
```json
{
  "success": true,
  "message": "Question paper deleted successfully"
}
```

#### 6. Duplicate Paper
- **URL:** `/papers/{id}/duplicate`
- **Method:** `POST`
- **Auth:** Optional
- **Response:**
```json
{
  "success": true,
  "post_id": 124,
  "message": "Question paper duplicated successfully"
}
```

## React Storage Utilities

### File: `src/app/utils/storage.ts`

#### Key Features

- **Hybrid Storage:** Uses localStorage as primary storage with WordPress as secondary
- **Automatic Sync:** Background synchronization with WordPress
- **Fallback Support:** If API fails, localStorage continues to work
- **Async Operations:** All save/delete operations are async

#### API Functions

```typescript
// Load papers (localStorage + background WordPress sync)
const papers = loadPapers();

// Save single paper to both localStorage and WordPress
await savePaper(paper);

// Save all papers
await savePapers(papers);

// Delete paper from both storage systems
await deletePaper(paperId);

// Duplicate paper
const newPaper = await duplicatePaper(paperId);

// Clear all papers from localStorage
clearAllPapers();
```

### Configuration

Toggle WordPress storage:
```typescript
const USE_WORDPRESS = true; // Set to false to use localStorage only
```

## WordPress Plugin Updates

### File: `wordpress-plugin/includes/class-qp-rest-api.php`

New methods added:
- `get_paper()` - Get single paper with full data
- `update_paper()` - Update existing paper
- `delete_paper()` - Delete paper
- `duplicate_paper()` - Create duplicate
- `get_user_from_request()` - Helper for auth token

### Data Storage

Papers are stored as WordPress custom post type `question_paper` with meta:
- `qp_data` - Full paper JSON
- `qp_page_settings` - Page settings JSON
- `qp_pdf_url` - Generated PDF URL
- `qp_pdf_generated_at` - PDF generation timestamp

## React Component Updates

### Dashboard (`src/app/pages/Dashboard.tsx`)

- Added loading state
- Updated delete and duplicate handlers to be async
- Error handling with toast notifications

### PaperSetup (`src/app/pages/PaperSetup.tsx`)

- `handleSubmit` is now async
- Awaits `savePaper()` call

### QuestionBuilder (`src/app/pages/QuestionBuilder.tsx`)

- `saveQuestion()` is now async
- `deleteQuestion()` is now async
- `duplicateQuestion()` is now async

## API Service Layer

### File: `src/app/utils/wpApiService.ts`

Provides the following functions:

```typescript
// Fetch all papers
await fetchAllPapers()

// Fetch single paper
await fetchPaperById(id)

// Save new paper
await savePaperToWordPress(title, data, pageSettings)

// Update existing paper
await updatePaperInWordPress(id, title, data, pageSettings)

// Delete paper
await deletePaperFromWordPress(id)

// Duplicate paper
await duplicatePaperInWordPress(id)
```

## Authentication

The API supports optional bearer token authentication via `Authorization` header:

```
Authorization: Bearer <auth_token>
```

Token is automatically included if present in localStorage:
```typescript
const token = localStorage.getItem('auth_token');
```

## Data Flow

### Save Operation

```
React Component
    ↓
savePaper() [storage.ts]
    ├→ Save to localStorage
    └→ If USE_WORDPRESS:
        └→ Call wpApiService API
           └→ Update WordPress
```

### Load Operation

```
React Component
    ↓
loadPapers() [storage.ts]
    ├→ Load from localStorage
    └→ If USE_WORDPRESS:
        └→ Background sync with WordPress
           └→ Merge data
```

### Delete Operation

```
React Component
    ↓
deletePaper() [storage.ts]
    ├→ Remove from localStorage
    └→ If USE_WORDPRESS && is_wordpress_id:
        └→ Call DELETE /papers/{id}
           └→ Delete from WordPress
```

## Error Handling

- API errors fall back to localStorage
- Toast notifications inform user of operations
- Console logs track issues
- No blocking on API failures

## Migration Notes

### For Existing Users

1. **Initial Login:** App loads localStorage data
2. **Background Sync:** WordPress papers are fetched and merged
3. **New Papers:** Get WordPress IDs after creation
4. **Temporary IDs:** Papers with temp- prefix stay local until synced

### Disabling WordPress Storage

To use localStorage only:
```typescript
// In src/app/utils/storage.ts
const USE_WORDPRESS = false;
```

## Testing

### Manual Testing Steps

1. **Create Paper:**
   - Create new paper
   - Check localStorage
   - Check WordPress custom post type

2. **Update Paper:**
   - Edit paper
   - Verify changes in both storages

3. **Delete Paper:**
   - Delete paper
   - Confirm removal from both locations

4. **Duplicate Paper:**
   - Duplicate paper
   - Verify new ID in WordPress

5. **Offline Mode:**
   - Disable network
   - Verify localStorage operations work
   - Operations sync when online

## Troubleshooting

### Papers Not Syncing

- Check API URL in `wpApiService.ts`
- Verify WordPress plugin is active
- Check auth token in localStorage

### API Errors

- Check browser console for error details
- Verify WordPress REST API is enabled
- Check CORS headers in WordPress plugin

### Slow Performance

- Reduce background sync frequency
- Check network conditions
- Review WordPress database indexes

## Future Enhancements

- [ ] Real-time sync with WebSockets
- [ ] Conflict resolution for concurrent edits
- [ ] Selective sync (sync specific papers only)
- [ ] Offline queue for operations
- [ ] Compression for large papers
- [ ] Version control for papers
