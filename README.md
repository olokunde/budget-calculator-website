# BudgetFlow — Budget Calculator

A fintech-inspired budget, savings, and debt calculator built with React + Vite.

This repo is prepared for production builds and hosting on Vercel.

Quick status

- Vite build scripts present (`npm run build`).
- Client-side state for the main budget is persisted to `localStorage`.
- Savings and Debt calculators now persist to `localStorage` so values survive refresh.
- SEO helpers: `sitemap.xml`, `robots.txt`, JSON-LD in `index.html`.
- AdSense placeholders and guidance in `README_DEPLOY.md`.

Local development

```bash
# install dependencies
npm install

# run dev server
npm run dev
```

Production build (locally)

```bash
npm run build
npm run preview
```

Prepare GitHub and Vercel deployment

1. Commit your changes to a new branch and push to GitHub.

```bash
git checkout -b release/prep-vercel
git add -A
git commit -m "chore: prepare app for Vercel deployment (persist calculators, SEO, readme)"
git push -u origin release/prep-vercel
```

2. Create a GitHub repository (if you haven't) and push the branch as above.

3. Deploy to Vercel (recommended)

- Sign in to Vercel and "New Project" → Import Git Repository.
- Vercel will auto-detect Vite + React in most cases.
- Build command: `npm run build`
- Output directory: `dist`
- Environment: none required for a static build.

Exact commands for GitHub + Vercel from a clean working copy

```bash
# Create repo locally (if not created) and push to GitHub
git init
git add .
git commit -m "Initial commit"
# Create a remote on GitHub and push (replace <your-remote-url>)
git remote add origin <your-remote-url>
git branch -M main
git push -u origin main

# After connecting repo to Vercel, deploy from Vercel dashboard.
# Alternatively use Vercel CLI to deploy (recommended for quick previews):
npm i -g vercel
vercel login
vercel --prod
```

Notes & cleanup

- There is a nested `budget-calculator/budget-calculator` folder in this workspace that may be a duplicate template. Consider removing it before pushing to avoid confusion:

```bash
# inspect the folder contents first
ls budget-calculator/budget-calculator

# remove it from git and disk (only if it's a duplicate)
rm -rf budget-calculator/budget-calculator
git add -A
git commit -m "chore: remove duplicate nested project"
```

- If you use a custom domain, update `index.html` meta tags (`canonical`, Open Graph image URLs) and `sitemap.xml`/`robots.txt` entries to your domain.

If you want, I can create the GitHub repo, remove duplicate files, and trigger an initial Vercel deploy for you — tell me which you'd like me to do next.

## Update

This project helps users plan budgets, track savings goals, and manage personal finances.
