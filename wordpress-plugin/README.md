# School Question Generator Subscription Plugin

This WordPress plugin provides the backend subscription and user management for the School Question Generator application.

## Features

- **Roles**: 
  - `school_admin`: Represents a school subscription. Can manage teachers.
  - `teacher`: Represents a teacher under a school.
- **Subscription Management**:
  - Manual activation by Super Admin via User Profile.
- **REST API**:
  - `GET /sqg/v1/status`: Check subscription status.
  - `GET /sqg/v1/teachers`: List teachers for a school.
  - `POST /sqg/v1/teachers`: Add a teacher (Limit 20).
  - `DELETE /sqg/v1/teachers/{id}`: Remove a teacher.

## Installation

1. Zip this folder.
2. Upload to WordPress Plugins.
3. Activate.
