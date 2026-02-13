# WordPress REST API Specification - Question Papers

## Base Information

- **API Version:** 1.0
- **Base URL:** `https://your-domain.com/wp-json/qpm/v1`
- **Authentication:** Optional (Bearer token)
- **Response Format:** JSON
- **Default Status Codes:** 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Server Error

## Endpoints Reference

---

## 1. GET /papers

**Get all question papers**

### Request
```
GET /wp-json/qpm/v1/papers
Authorization: Bearer <optional-token>
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| None | - | - | Currently no filters supported |

### Response (200 OK)
```json
{
  "success": true,
  "papers": [
    {
      "id": "123",
      "title": "Mathematics Class Test",
      "createdAt": "2024-02-13T10:00:00Z",
      "updatedAt": "2024-02-13T10:30:00Z",
      "pdf_url": "https://example.com/pdf/123.pdf",
      "data": {
        "id": "123",
        "setup": {
          "subject": "গণিত",
          "examType": "class-test",
          "schoolName": "ABC School",
          "date": "2024-02-13",
          "timeMinutes": 60,
          "totalMarks": 100,
          "layout": "1",
          "instructions": ""
        },
        "questions": [
          {
            "id": "q1",
            "number": 1,
            "type": "mcq",
            "blocks": [],
            "marks": 5,
            "optional": false
          }
        ],
        "createdAt": "2024-02-13T10:00:00Z",
        "updatedAt": "2024-02-13T10:30:00Z"
      },
      "pageSettings": {
        "fontSize": 12,
        "fontFamily": "Arial"
      },
      "has_pdf": true
    }
  ],
  "total": 1
}
```

### Error Response (500)
```json
{
  "code": "server_error",
  "message": "Error message",
  "data": {
    "status": 500
  }
}
```

---

## 2. GET /papers/{id}

**Get a specific question paper**

### Request
```
GET /wp-json/qpm/v1/papers/123
Authorization: Bearer <optional-token>
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | WordPress post ID of the paper |

### Response (200 OK)
```json
{
  "success": true,
  "paper": {
    "id": "123",
    "title": "Mathematics Class Test",
    "createdAt": "2024-02-13T10:00:00Z",
    "updatedAt": "2024-02-13T10:30:00Z",
    "pdf_url": "https://example.com/pdf/123.pdf",
    "data": { /* full paper object */ },
    "pageSettings": { /* page settings */ }
  }
}
```

### Error Response (404)
```json
{
  "code": "not_found",
  "message": "Question paper not found",
  "data": {
    "status": 404
  }
}
```

---

## 3. POST /papers

**Create a new question paper**

### Request
```
POST /wp-json/qpm/v1/papers
Content-Type: application/json
Authorization: Bearer <optional-token>

{
  "title": "Mathematics Final Exam",
  "data": { /* full paper object */ },
  "pageSettings": { /* page settings */ }
}
```

### Request Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| title | string | Yes | Paper title/name (max 255 chars) |
| data | object | Yes | Full paper object with questions |
| pageSettings | object | No | Page formatting settings |

### Example Request
```json
{
  "title": "Math Paper",
  "data": {
    "setup": {
      "subject": "গণিত",
      "examType": "class-test",
      "schoolName": "ABC School",
      "date": "2024-02-13",
      "timeMinutes": 60,
      "totalMarks": 100,
      "layout": "1",
      "instructions": ""
    },
    "questions": []
  },
  "pageSettings": {
    "fontSize": 12
  }
}
```

### Response (201 Created)
```json
{
  "success": true,
  "post_id": 123,
  "message": "Question paper saved successfully"
}
```

### Error Response (400)
```json
{
  "code": "missing_data",
  "message": "Title and question paper data are required",
  "data": {
    "status": 400
  }
}
```

---

## 4. PUT /papers/{id}

**Update an existing question paper**

### Request
```
PUT /wp-json/qpm/v1/papers/123
Content-Type: application/json
Authorization: Bearer <optional-token>

{
  "title": "Updated Title",
  "data": { /* full paper object */ },
  "pageSettings": { /* page settings */ }
}
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | WordPress post ID |

### Request Body
Same as POST /papers - all parameters optional for updates

### Response (200 OK)
```json
{
  "success": true,
  "post_id": 123,
  "message": "Question paper updated successfully"
}
```

### Error Response (404)
```json
{
  "code": "not_found",
  "message": "Question paper not found",
  "data": {
    "status": 404
  }
}
```

---

## 5. DELETE /papers/{id}

**Delete a question paper**

### Request
```
DELETE /wp-json/qpm/v1/papers/123
Content-Type: application/json
Authorization: Bearer <optional-token>
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | WordPress post ID |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Question paper deleted successfully"
}
```

### Error Response (404)
```json
{
  "code": "not_found",
  "message": "Question paper not found",
  "data": {
    "status": 404
  }
}
```

---

## 6. POST /papers/{id}/duplicate

**Create a duplicate of a question paper**

### Request
```
POST /wp-json/qpm/v1/papers/123/duplicate
Content-Type: application/json
Authorization: Bearer <optional-token>
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | integer | Yes | WordPress post ID of paper to duplicate |

### Response (201 Created)
```json
{
  "success": true,
  "post_id": 124,
  "message": "Question paper duplicated successfully"
}
```

### Error Response (404)
```json
{
  "code": "not_found",
  "message": "Question paper not found",
  "data": {
    "status": 404
  }
}
```

---

## Data Types

### Paper Object
```typescript
{
  id: string;                    // WordPress post ID (numeric string)
  title: string;                 // Paper title
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  pdf_url?: string;              // Optional PDF URL
  data: {
    id: string;
    setup: {
      subject: string;
      examType: 'class-test' | 'half-yearly' | 'annual' | 'model-test';
      schoolName?: string;
      date: string;              // YYYY-MM-DD
      timeMinutes: number;
      totalMarks: number;
      layout: string;
      instructions?: string;
    };
    questions: Question[];
    createdAt: string;
    updatedAt: string;
  };
  pageSettings?: {
    [key: string]: any;          // Custom page settings
  };
}
```

### Question Object
```typescript
{
  id: string;
  number: number;
  type: string;                  // mcq, creative, etc.
  blocks: Block[];
  marks: number;
  optional: boolean;
  subQuestions?: SubQuestion[];
}
```

### Block Object
```typescript
{
  type: string;                  // text, table, image, etc.
  content: {
    [key: string]: any;          // Content varies by type
  };
}
```

---

## Authentication

### Bearer Token Format
```
Authorization: Bearer <token>
```

### Token Storage
Tokens are stored in WordPress user meta:
- Key: `myqugen_auth_token`
- Value: MD5 hash of user ID + timestamp + random string

### Example with Token
```bash
curl -X GET "https://example.com/wp-json/qpm/v1/papers" \
  -H "Authorization: Bearer abc123def456"
```

---

## Error Handling

### HTTP Status Codes
| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST, POST (duplicate) |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Paper doesn't exist |
| 500 | Server Error | WordPress error |

### Error Response Format
```json
{
  "code": "error_code",
  "message": "Human readable message",
  "data": {
    "status": 400
  }
}
```

---

## Rate Limiting

Currently no rate limiting implemented. 
Can be added via WordPress plugins or .htaccess rules.

---

## CORS Headers

Automatically added by plugin:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Examples

### Create and Update Flow
```bash
# 1. Create paper
curl -X POST "https://example.com/wp-json/qpm/v1/papers" \
  -H "Content-Type: application/json" \
  -d '{"title":"Math","data":{"setup":{"subject":"Math"}}}'
# Returns: {"success":true,"post_id":123}

# 2. Update paper
curl -X PUT "https://example.com/wp-json/qpm/v1/papers/123" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Math"}'
# Returns: {"success":true,"post_id":123}

# 3. Get paper
curl -X GET "https://example.com/wp-json/qpm/v1/papers/123"
# Returns: {"success":true,"paper":{...}}

# 4. Duplicate paper
curl -X POST "https://example.com/wp-json/qpm/v1/papers/123/duplicate"
# Returns: {"success":true,"post_id":124}

# 5. Delete paper
curl -X DELETE "https://example.com/wp-json/qpm/v1/papers/123"
# Returns: {"success":true,"message":"..."}
```

---

## Version History

### Version 1.0 (Current)
- Initial release
- Full CRUD operations
- Duplicate functionality
- Authentication support
- Background sync ready

---

## Future Enhancements

- [ ] Field filtering (return only specific fields)
- [ ] Pagination (limit/offset parameters)
- [ ] Search/filter by subject, exam type
- [ ] Batch operations
- [ ] Webhooks for real-time updates
- [ ] GraphQL endpoint
- [ ] API key authentication
- [ ] Rate limiting

---

## Support & Contact

For API issues:
1. Check WordPress debug log
2. Verify plugin is activated
3. Verify REST API is enabled
4. Check CORS headers in response

Last Updated: February 13, 2026
