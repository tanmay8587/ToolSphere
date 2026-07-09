# AI Tools Directory

A polished AI tools directory built with React, Vite, Tailwind CSS, Express, and MongoDB.

## Features

- Premium, responsive landing experience
- Category browsing and AI tool listings
- Search and filtering for tools
- Tool detail pages
- Blog and contact pages
- Express API with health and tools endpoints
- Admin panel for tool management
- Image upload with Cloudinary
- SEO optimized (sitemap.xml, robots.txt)

## Project Structure

```
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/    # Page components
│   │   ├── services/ # API services
│   │   └── hooks/    # Custom hooks
├── backend/            # Express backend
│   ├── server/
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   └── utils/       # Utility functions
```

## Getting started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Cloudinary account

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for JWT tokens |
| `ADMIN_EMAIL` | Default admin email |
| `ADMIN_PASSWORD` | Default admin password |
| `CORS_ORIGIN` | Frontend URL (e.g., http://localhost:5173) |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g., http://localhost:5000/api) |

## API Endpoints

### Public Routes

- `GET /api/tools` - Get all tools (with search/filter)
- `GET /api/tools/:slug` - Get tool by slug
- `GET /api/tools/featured` - Get featured tools
- `GET /api/tools/categories` - Get all categories
- `GET /api/tools/:slug/related` - Get related tools

### Admin Routes

- `POST /admin/login` - Admin login
- `GET /admin/profile` - Get admin profile
- `GET /admin/dashboard` - Get dashboard stats
- `GET /admin/tools` - Get all tools (admin)
- `POST /admin/tools` - Add new tool
- `PUT /admin/tools/:id` - Update tool
- `DELETE /admin/tools/:id` - Delete tool

## Deployment notes

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Testing

```bash
cd backend
npm test
```

## License

MIT
