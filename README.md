# Hasan Alanya · personal website

An interactive portfolio site written in plain HTML, CSS and JavaScript. There's no build step and nothing to install, so it runs as-is on GitHub Pages.

Live at **https://hasanalanya.github.io**

## What's in the folder

```
index.html              page structure
css/style.css           all styling (dark + light theme, warm red palette)
js/data.js              ALL the content: jobs, papers, skills, awards…
js/main.js              renders the content and wires up interactions
js/visuals.js           hero network, 3D DNA helix, skills graph
assets/favicon.svg      browser-tab icon
.nojekyll               tells GitHub Pages to serve files untouched
```

**To update the site, you'll usually only edit `js/data.js`.** For example, to add a new paper, copy one of the entries in `PUBLICATIONS`, change the fields and save. The year chart, filters, counts and terminal pick it up automatically. Set `featured: true` (plus a one-line `summary`) to show a paper as a highlight card.

## Privacy

- No email address, phone number or CV is published on the site. Visitors reach you through LinkedIn and GitHub.
- `.gitignore` blocks every `.pdf` file, so a CV kept in this folder can never be uploaded by accident.
- Commits use your private GitHub address (`…@users.noreply.github.com`), not your real email.

## Preview it on your Mac

```bash
cd ~/Desktop/Personal_Website
python3 -m http.server 8000
```

Then open http://localhost:8000. Press `Ctrl+C` in the terminal to stop it.

## Publish changes

```bash
cd ~/Desktop/Personal_Website
git add .
git commit -m "Describe the change"
git push
```

GitHub Pages redeploys automatically about a minute after each push.

### Optional: your own domain

Buy a domain (e.g. `hasanalanya.com`) from any registrar. In the repo's **Settings → Pages → Custom domain**, enter it, then add the DNS records GitHub shows you at your registrar. Tick **Enforce HTTPS** once it's available.
