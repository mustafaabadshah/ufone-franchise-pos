# Free Live Deployment Guide (Frontend & Backend)
## Ufone 4G Franchise POS & S&D Management System

This guide explains how to get your full application (both frontend and backend) deployed live on the internet **100% free** with zero hosting costs and no credit card required.

---

### Architecture for Free Cloud Hosting

The application is structured to support **Unified Single-Service Hosting**:
- The FastAPI backend serves all REST API endpoints under `/api/v1`.
- The FastAPI backend also serves the built React production frontend (`frontend/dist` or `backend/static`).
- **Advantage**: You only need to host **ONE single free web service** instead of two separate paid services. No CORS errors, instant HTTPS, and zero maintenance.

---

### Option 1: Render.com (Recommended — 100% Free, 1 Click)

Render provides free cloud web services with automatic SSL certificates and a free `*.onrender.com` domain.

#### Step 1: Create a Free GitHub Repository
1. Go to [https://github.com/new](https://github.com/new) and create a repository (e.g. `ufone-franchise-pos`).
2. Run these commands in your project terminal:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ufone-franchise-pos.git
   git branch -M main
   git push -u origin main
   ```

#### Step 2: Deploy on Render.com
1. Go to [https://dashboard.render.com/](https://dashboard.render.com/) and sign up for free (using your GitHub account).
2. Click **New +** in the top right and select **Web Service**.
3. Select your GitHub repository `ufone-franchise-pos`.
4. Render will automatically detect `render.yaml`, or fill in these settings:
   - **Name**: `ufone-franchise-pos`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
5. Click **Deploy Web Service**.

That's it! In ~2 minutes, Render will provide your permanent public HTTPS URL:
👉 `https://ufone-franchise-pos.onrender.com`

---

### Option 2: Koyeb or Railway (100% Free with Docker)

A production [Dockerfile](file:///e:/Ufone%20Franchice%20App/Dockerfile) is included in the project root.

1. Push your repository to GitHub.
2. Sign up for free at [https://www.koyeb.com](https://www.koyeb.com) or [https://railway.app](https://railway.app).
3. Choose **Deploy with Docker** and select your repository.
4. Koyeb/Railway will automatically build the container and provide your free live HTTPS link.

---

### Option 3: Separate Frontend on Vercel + Backend on Render

If you prefer hosting the React frontend on Vercel's global CDN:

1. **Deploy Backend to Render** (using Option 1 above). Note your backend URL (e.g., `https://ufone-api.onrender.com`).
2. **Deploy Frontend to Vercel**:
   - Go to [https://vercel.com/new](https://vercel.com/new) and import your repository.
   - Set **Root Directory**: `frontend`.
   - Set Environment Variable:
     - Key: `VITE_API_BASE`
     - Value: `https://ufone-api.onrender.com/api/v1`
   - Click **Deploy**. Vercel will give you a free `*.vercel.app` domain.

---

### Option 4: Instant Public Access via ngrok / Cloudflare (Right Now!)

If you want an immediate live link on the internet right now from your running machine without creating any cloud accounts:

1. Install ngrok from [https://ngrok.com/download](https://ngrok.com/download) or Cloudflare Tunnel:
2. Run in a new terminal:
   ```bash
   ngrok http 8000
   ```
   Or using Cloudflare:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
3. It will give you a public URL (e.g. `https://xxxx.ngrok-free.app` or `https://xxxx.trycloudflare.com`) that anyone can open on mobile or PC anywhere in the world!

### Secure User Roles & Account Architecture

To safeguard your production franchise operations, **passwords and encryption keys are strictly omitted from public repository documentation**. Configure your administrator secrets privately through your cloud hosting environment variables.

| Role | Authorized User | System Access Level | Initial Setup Guideline |
|---|---|---|---|
| **Franchise Incharge / Admin** | `shahidkhan@pos.com` | Full Operations & POS Master | Set via private environment secret or admin panel |
| **Franchise Owner (Audit View)** | `islambadshah@pos.com` | Executive Audits, Reports, P&L (Viewer) | Restricted read-only executive access |
| **Operations Manager** | `manager@pos.com` | Inventory, Stock & Staff Dispatch | Standard operational profile |
| **Cashier / POS Terminal** | `cashier@pos.com` | POS Counter & Sales Billing | Counter billing terminal |
| **RSO Field Officer** | `rso1@pos.com` | Daily Route Sales & Float Management | Field distribution profile |

> [!IMPORTANT]
> **Production Security Best Practice:**
> 1. Set `SECRET_KEY` and initial admin credentials in your **Render Environment Variables** dashboard (or local `.env` file). Never push private passwords to public git repositories.
> 2. Change all default passwords immediately after your first sign-in via the **Administration > Users & Access** panel.
> 3. Security audit events are recorded in real time under the **Security Audit Logs** tab.
