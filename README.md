# Public Health Dashboard

![โลโก้กระทรวงสาธารณสุข](public/moph-logo.svg)

Dashboard ติดตามประเด็นขับเคลื่อนตัวชี้วัดของคณะกรรมการประสานงานสาธารณสุขระดับอำเภอสอง
This project provides an interactive dashboard for the Song District Public Health Coordinating Committee to track indicator-driven initiatives.

## Technologies
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Getting Started

### Prerequisites
- Node.js & npm (recommend using [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Installation

```sh
git clone <YOUR_GIT_URL>
cd public-health-dash
npm install
cp .env.example .env # then edit API base URL if needed
npm run dev
```

The development server will run with hot reload for instant preview.

### Other Scripts

- `npm run build` – build the project for production.
- `npm run lint` – run linting.

### Environment Variables

This app reads the API base URL from Vite env variables.

- `VITE_API_BASE_URL` – Base URL for KPI API (default in `.env.example`).

Create a `.env` file (or use OS env) to override:

```
VITE_API_BASE_URL=https://your-api.example.com/exec
```

## Deployment

After running `npm run build`, deploy the contents of the `dist/` directory to any static hosting provider of your choice.

