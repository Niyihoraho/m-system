# 🚀 EC2 Deployment Checklist

## ✅ Pre-Deployment (Local Machine)

- [x] Build completed successfully (`npm run build-for-deploy`)
- [x] All ESLint and TypeScript errors resolved
- [x] Database connection tested locally
- [x] Environment variables configured
- [x] Files prepared for upload

## 📁 Files to Upload to EC2

Upload these files/folders to your EC2 instance in the `app` directory:

```
app/
├── .next/                 # Built application (REQUIRED)
├── public/               # Static assets
├── prisma/               # Database schema
├── package.json          # Dependencies and scripts
├── package-lock.json     # Dependency lock file
├── next.config.ts        # Next.js configuration
└── .env.example          # Environment template
```

## 🖥️ EC2 Server Setup Commands

```bash
# 1. Navigate to app directory
cd ~/app

# 2. Set up environment variables
cp .env.example .env
nano .env

# 3. Configure your .env file with:
DATABASE_URL="mysql://username:password@your-rds-endpoint:3306/database_name"
NEXTAUTH_URL="http://your-ec2-ip:3000"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
NODE_ENV="production"

# 4. Install production dependencies (faster than uploading node_modules)
npm ci --production

# 5. Generate Prisma Client for production
npx prisma generate

# 6. Verify database connection
npx prisma db push

# 7. Start the production server
npm run start
```

## 🔍 Verification Steps

- [ ] Server starts without errors
- [ ] Application accessible at `http://your-ec2-ip:3000`
- [ ] Database operations working
- [ ] Authentication working
- [ ] All pages loading correctly

## 🚨 Troubleshooting

### If you get "Could not find a production build":
- Ensure `.next` folder was uploaded
- Check file permissions: `chmod -R 755 .next`

### If you get database connection errors:
- Verify `.env` file configuration
- Check RDS security group allows EC2 access
- Test with `npx prisma db push`

### If npm install fails:
- Use `npm ci --production` instead of `npm install`
- Clear cache: `npm cache clean --force`

## 🔄 Future Deployments

For future updates:
1. Run `npm run build-for-deploy` locally
2. Upload only the `.next` folder (unless package.json changed)
3. Restart the server on EC2

## 📊 Performance Tips

- Use PM2 for process management: `npm install -g pm2`
- Start with PM2: `pm2 start "npm run start" --name "m-system"`
- Auto-restart on server reboot: `pm2 startup`
