# How to Deploy the Frontend to Vercel

Since we chose **Option A** (Split Deployment), we need to deploy the `frontend-react` folder to Vercel.

Because macOS permissions prevent me from authenticating the Vercel CLI or pushing to your GitHub automatically, here is the extremely simple 2-step process to get it live right now.

### Step 1: Push your code to GitHub
Open your terminal and run this to push the code I just committed:
```bash
cd /Users/mrchartist/.gemini/antigravity/scratch/PixelTrade_Brainstorm
git push origin main
```
*(If it asks for credentials, authenticate with GitHub)*

### Step 2: Deploy from the Vercel Dashboard
You already have the Vercel dashboard open in your browser (`https://vercel.com/mr-chartists-projects`).

1. Click **Add New** → **Project**.
2. Import the **`chartsnap`** repository from GitHub.
3. In the project configuration, find **Root Directory** and click **Edit**.
4. Select `frontend-react` and continue.
5. The Framework Preset should automatically be detected as **Vite**.
6. Click **Deploy**!

---

Once it's deployed, Vercel will give you a live URL (e.g. `https://chartsnap-ui.vercel.app`).

### Next Steps (Backend)
After Vercel is live, we need to host the backend (the database and charting engine) on a service like **Render** or **Railway** so the frontend can connect to it. Let me know when Vercel is done!
