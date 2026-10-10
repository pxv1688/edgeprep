# Putting Edge online with your own domain

About 30 minutes, most of it waiting for DNS. Cost: a domain, typically $10–15 a year. Hosting on GitHub Pages is free.

## 1. Pick and buy a domain (you)
Short, easy to spell, and not using a trading firm's name. Ideas to check: `edgequant.com`, `getedge.io`, `edgeprep.com`, `squareaday.com`, `quantsquare.app`.

Buy it at a registrar that sells at or near cost with free privacy protection:
- **Cloudflare Registrar** (at-cost pricing; needs a free Cloudflare account)
- **Porkbun** or **Namecheap** (simple, cheap)

## 2. Create the GitHub repository (you)
1. Sign up at https://github.com (free).
2. Click **New repository**, name it `edge`, set it to **Public**, and **don't** add a README.

## 3. Upload the site
The Edge folder is already a git repository with everything committed (the private `.claude` and `.impeccable` folders are excluded). In a terminal in the Edge folder:

```
git remote add origin https://github.com/YOUR-USERNAME/edge.git
git branch -M main
git push -u origin main
```
Windows will ask you to sign in to GitHub the first time.

## 4. Point the site at your domain
```
python tools/set_domain.py yourdomain.com
git add -A
git commit -m "Set domain"
git push
```

## 5. Turn on GitHub Pages
In the repository: **Settings > Pages**
- Source: **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
- Custom domain: `yourdomain.com`, then Save.

## 6. Connect the domain (at your registrar's DNS settings)
Add these records:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | YOUR-USERNAME.github.io |

Delete any old "parking" A records the registrar added. DNS can take up to a few hours. Once GitHub shows the domain as verified, tick **Enforce HTTPS** on the Pages settings.

On Cloudflare, set these records to **DNS only** (grey cloud) until HTTPS works.

## 7. Switch on accounts
Follow `SETUP.md`, using `https://yourdomain.com/` as the Site URL and `https://yourdomain.com/account.html` and `https://yourdomain.com/reset.html` as redirect URLs.

## 8. After launch
- Add your contact email on the Privacy, Terms and About pages.
- Submit `https://yourdomain.com/sitemap.xml` in Google Search Console so Google finds the site.
- Share a link anywhere: the cobalt preview card (`assets/img/og.png`) shows up automatically.

## Updating the site later
Edit files, then:
```
git add -A
git commit -m "Describe the change"
git push
```
GitHub Pages republishes within a minute.
