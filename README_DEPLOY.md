Deployment & SEO / AdSense guide

This file explains how to build and deploy this Vite React app, how to add AdSense, and SEO recommendations.

Build (local)

1. Install deps

```bash
npm install
```

2. Run dev (local preview)

```bash
npm run dev
```

3. Build for production

```bash
npm run build
# Preview the production build locally
npm run preview
```

Recommended hosting options (pick one)

- Vercel (recommended for Git-based auto deploys)
  - Connect your GitHub/GitLab repo to Vercel.
  - Set the framework to `Vite` (auto-detected) and `npm run build` as build command.
  - Output directory: `dist`.

- Netlify
  - Connect repo, build command `npm run build`, publish directory `dist`.

- GitHub Pages
  - Use `gh-pages` or a workflow to build and push `dist` to `gh-pages` branch.

DNS and HTTPS

- Point your domain to the host (Vercel/Netlify) and enable automatic HTTPS.

AdSense integration (steps)

1. Create an AdSense account and add your site.
2. Add the AdSense `adsbygoogle.js` script to `index.html` head:

```html
<script data-ad-client="ca-pub-XXXXXXXXXXXX" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
```

Replace `ca-pub-XXXXXXXXXXXX` with your publisher ID.

3. Use responsive ad units where you want ads to appear. Example (uncomment in `src/App.jsx` ad slot):

```jsx
<ins className="adsbygoogle"
     style={{display:'block'}}
     data-ad-client="ca-pub-XXXXXXXXXXXX"
     data-ad-slot="YYYYYYYYYY"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

4. Add `ads.txt` to your site root with your publisher ID per AdSense instructions.

SEO checklist

- Update `index.html` meta tags: `title`, `description`, `canonical`, Open Graph and Twitter meta tags.
- Add `sitemap.xml` and `robots.txt` (already present; update `example.com` to your real domain).
- Add structured data (JSON-LD) in `index.html` (already added).
- Use descriptive headings (`h1`, `h2`), alt text for images, and meaningful link text.
- Serve compressed assets (Vercel/Netlify do this automatically).
- Optimize images (use WebP/AVIF) and pre-generate a small `preview.png` used by Open Graph.
- Run Lighthouse and monitor Core Web Vitals.

Ad placement & policy tips

- Avoid placing ads too close to interactive elements (buttons/inputs) per policy.
- Do not incentivize clicks or mislead users to click ads.
- Keep at most a few prominent ad slots above-the-fold to preserve UX.

Testing & validation

- Use Google Rich Results Test for JSON-LD.
- Use Google Search Console to submit sitemap and monitor indexing.
- Use Lighthouse / PageSpeed Insights to check performance and mobile UX.

If you'd like, I can:

- Wire in a real AdSense ID (if you provide it).
- Add `ads.txt` file and example `preview.png` for social preview.
- Create a Vercel deployment and add environment variables.
