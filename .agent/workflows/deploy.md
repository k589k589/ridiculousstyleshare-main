---
description: How to build and deploy the application
---

# Deploy Workflow

Follow these steps to deploy the application:

## 1. Run Tests
Ensure all tests pass before deploying:
```bash
npm test
```

## 2. Build for Production
// turbo
```bash
npm run build
```

## 3. Deploy
Deploy to your hosting platform (update this based on your setup):
```bash
# Example: Deploy to Vercel
npx vercel --prod
```

## Notes
- Always verify the build locally before deploying
- Check for any console errors or warnings
