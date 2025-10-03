# Deployment Instructions

## Files to Upload to EC2:
- .next
- public
- prisma
- package.json
- package-lock.json
- next.config.ts

## Commands to run on EC2 after upload:

1. Navigate to your app directory:
   cd /path/to/your/app

2. Copy .env.example to .env and configure:
   cp .env.example .env
   nano .env

3. Install production dependencies:
   npm ci --production

4. Generate Prisma Client:
   npx prisma generate

5. Start the application:
   npm run start

## Your app will be available at:
http://your-ec2-ip:3000
