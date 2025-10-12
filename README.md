# Building in Public - Transparency Website

A full-stack transparency website built with Next.js 15, PostgreSQL, and Drizzle ORM. Inspired by Marc Lou's building-in-public approach. Post 4 daily updates (6am, 11am, 2pm, 6pm) and showcase your projects every 2 days.

## Features

- Next.js 15 with App Router
- PostgreSQL database with Drizzle ORM
- TypeScript throughout
- Tailwind CSS for styling
- RESTful API routes
- Docker support for easy deployment
- Coolify-ready configuration
- Daily updates timeline
- Project showcase
- Newsletter subscription
- Real-time stats tracking

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS
- **Deployment**: Coolify / Docker

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/fmillanjs/fmjs.git
   cd fmjs
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/transparency_db

   # Next.js
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # Your Info
   NEXT_PUBLIC_NAME="Your Name"
   NEXT_PUBLIC_LOCATION="Your Location"
   NEXT_PUBLIC_TWITTER_URL="https://twitter.com/yourusername"
   NEXT_PUBLIC_GITHUB_URL="https://github.com/yourusername"
   NEXT_PUBLIC_START_DATE="2025-10-12"
   ```

4. **Set up the database**

   ```bash
   # Generate database migrations
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed initial profile data
   npx tsx lib/db/seed.ts
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding Daily Updates

You can add updates via the CLI:

```bash
npx tsx scripts/add-update.ts "6:00 AM" "Starting the day with coffee and code!"
```

Or via the API:

```bash
curl -X POST http://localhost:3000/api/updates \
  -H "Content-Type: application/json" \
  -d '{"time": "6:00 AM", "content": "Your update here", "date": "Oct 12, 2025"}'
```

### Adding Projects

Via CLI:

```bash
npx tsx scripts/add-project.ts "My App" "🚀" "A cool app description" "https://myapp.com" "$100/mo" "live"
```

Via API:

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My App", "logo": "🚀", "description": "A cool app", "link": "https://myapp.com", "revenue": "$100/mo", "status": "live"}'
```

## Deployment on Coolify

### Prerequisites

- Coolify instance running
- GitHub repository connected
- PostgreSQL database created in Coolify

### Steps

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/fmillanjs/fmjs.git
   git push -u origin main
   ```

2. **Create a new application in Coolify**

   - Go to your Coolify dashboard
   - Click "New Resource" → "Public Repository"
   - Enter your repository URL: `https://github.com/fmillanjs/fmjs`
   - Select branch: `main`

3. **Configure environment variables in Coolify**

   Add these environment variables in Coolify:

   ```
   DATABASE_URL=postgresql://user:password@postgres:5432/transparency_db
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   NEXT_PUBLIC_NAME=Your Name
   NEXT_PUBLIC_LOCATION=Your Location
   NEXT_PUBLIC_TWITTER_URL=https://twitter.com/yourusername
   NEXT_PUBLIC_GITHUB_URL=https://github.com/yourusername
   NEXT_PUBLIC_START_DATE=2025-10-12
   ```

4. **Deploy**

   - Coolify will automatically detect the Dockerfile
   - Click "Deploy"
   - Wait for the build to complete

5. **Run database migrations**

   After first deployment, access the container shell in Coolify and run:

   ```bash
   npm run db:push
   npx tsx lib/db/seed.ts
   ```

6. **Set up domain**

   - Configure your domain in Coolify
   - Enable SSL/TLS

## Alternative Deployment (Docker Compose)

For manual deployment using Docker Compose:

```bash
# Create .env file with all variables
cp .env.example .env

# Build and start containers
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:push
docker-compose exec app npx tsx lib/db/seed.ts
```

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── updates/      # Updates CRUD
│   │   ├── projects/     # Projects CRUD
│   │   └── newsletter/   # Newsletter subscription
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── Hero.tsx
│   ├── Stats.tsx
│   ├── Updates.tsx
│   ├── Projects.tsx
│   ├── Newsletter.tsx
│   └── Footer.tsx
├── lib/
│   └── db/              # Database configuration
│       ├── index.ts     # DB connection
│       ├── schema.ts    # Drizzle schema
│       └── seed.ts      # Seed script
├── scripts/             # Helper scripts
│   ├── add-update.ts
│   └── add-project.ts
├── public/              # Static assets
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose config
└── drizzle.config.ts    # Drizzle ORM config
```

## Database Schema

### Profile Table

- `id`: Primary key
- `name`: Your name
- `location`: Your location
- `tagline`: Your tagline
- `profileImage`: Profile image URL
- `twitterUrl`, `githubUrl`: Social links
- `startDate`: Date you started building

### Updates Table

- `id`: Primary key
- `time`: Time of update (e.g., "6:00 AM")
- `content`: Update content
- `date`: Date string
- `createdAt`: Timestamp

### Projects Table

- `id`: Primary key
- `name`: Project name
- `logo`: Emoji or image URL
- `description`: Project description
- `link`: Project URL
- `revenue`: Monthly revenue
- `status`: 'building', 'live', or 'paused'
- `daysToComplete`: Days to build
- `createdAt`, `completedAt`: Timestamps

## Customization

### Change Colors

Edit Tailwind classes in components or update `tailwind.config.ts`.

### Add Authentication

For a private admin panel to add updates/projects, consider:

- NextAuth.js
- Clerk
- Supabase Auth

### Newsletter Integration

Update `app/api/newsletter/route.ts` to integrate with:

- Mailchimp
- ConvertKit
- Buttondown
- Resend

Example for Resend:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.contacts.create({
  email: email,
  audienceId: process.env.RESEND_AUDIENCE_ID,
});
```

## Tips for Building in Public

1. **Be Consistent**: Post your 4 daily updates at the same times
2. **Be Honest**: Share both wins and struggles
3. **Be Detailed**: Show your process, not just results
4. **Update Regularly**: Add projects every 2 days as you complete them
5. **Engage**: Share your journey on Twitter and engage with your audience

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:generate   # Generate migrations
npm run db:migrate    # Run migrations
npm run db:push       # Push schema to DB
npm run db:studio     # Open Drizzle Studio
```

## Contributing

Feel free to fork this project and customize it for your own use!

## License

MIT

## Support

For issues or questions:
- GitHub Issues: https://github.com/fmillanjs/fmjs/issues
- Twitter: [Your Twitter]

---

Built with transparency. Updated daily.
