# Fix My Road

Frontend prototype for the Fix My Road civic issue reporting platform.

## Overview

This project is a Next.js frontend built with TypeScript and Tailwind CSS.
It includes:

- Landing page
- Login page
- Signup page
- Citizen dashboard
- Report submission form
- My reports list
- Report details page

Mock data is used for the initial UI flow.

## Setup

```bash
cd fix-my-road
npm install
npm run dev
```

## Notes

- Project uses the App Router (`app/`)
- `node_modules/`, `.dnv`, and build artifacts are ignored in `.gitignore`
- No backend or ML integration is implemented yet

## Folder structure

- `app/` - route pages
- `components/` - reusable UI components
- `lib/` - mock data and shared utilities
- `types/` - TypeScript models
