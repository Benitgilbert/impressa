# Deploying Impressa to Vercel

Since your backend is already on **Render**, here is how to deploy the Frontend to **Vercel** and connect them.

## Prerequisites
1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **GitHub Repo**: Ensure your code is pushed to GitHub (I just did this for you).

## Step 1: Import Project to Vercel
1.  Go to your **Vercel Dashboard**.
2.  Click **"Add New..."** -> **"Project"**.
3.  Select **"Continue with GitHub"**.
4.  Find your repository (`impressa`) and click **"Import"**.

## Step 2: Configure Project settings
In the "Configure Project" screen:
1.  **Framework Preset**: It should auto-detect **Create React App**. If not, select it.
2.  **Root Directory**: Click "Edit" and select `impressa-frontend`. (This is crucial because your repo has both backend and frontend folders).
3.  **Build Command**: Leave as `npm run build`.
4.  **Output Directory**: Leave as `build`.

## Step 3: Add Environment Variables
Expand the **"Environment Variables"** section. You need to tell the frontend where your backend lives.

| Key | Value | Example |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | **Your Render Backend URL** | `https://impressa-api.onrender.com/api` |

> **Important**: key sure to add `/api` at the end of your Render URL if your backend routes start with `/api`.

## Step 4: Deploy
1.  Click **"Deploy"**.
2.  Wait for Vercel to build your site (approx. 1-2 mins).
3.  Once done, you will get a live URL (e.g., `https://impressa-frontend.vercel.app`).

## Step 5: Update Backend CORS (Crucial!)
Your Backend on Render might be blocking the new Vercel domain. You need to update your Backend config:
1.  Go to your **Render Dashboard**.
2.  Open your Backend service settings.
3.  Update the `CORS_ORIGIN` or `ALLOWED_ORIGINS` environment variable to include your new Vercel URL (with no trailing slash).
    *   Example: `http://localhost:3000,https://impressa-frontend.vercel.app`

## Troubleshooting
*   **404 on Refresh**: I already added `vercel.json` to fix this.
*   **Network Error / CORS Error**: Check Step 5.
