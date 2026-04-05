This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


### Where to save `bot_manager.py`?

You should save `bot_manager.py` (and the associated `binance_service.py`, `mt5_service.py`, etc.) in a folder named **`backend`** at the root of your project:

**Recommended Path:** `d:\Project\kimoo-frontend1\backend\bot_manager.py`

#### Why?
1.  **Isolation:** This is backend logic (Python) that runs as a long-lived process. Keeping it out of the `/src` folder prevents it from being mixed up with Next.js frontend code.
2.  **Deployment:**
   *   **Linux/Cloud:** You will run `bot_manager.py` here to handle **Binance** trades.
   *   **Windows VPS:** You will copy this entire `backend/` folder to your Windows VPS to run the **MT5** execution engine.
3.  **Redis Sync:** The Next.js API (in `/src/app/api/terminal/control/route.ts`) will send commands to Redis, and `bot_manager.py` (running anywhere) will pick them up from the same Redis instance.

<!--
[PROMPT_SUGGESTION]Create the Next.js API route that interacts with Redis to control these bots.[/PROMPT_SUGGESTION]
[PROMPT_SUGGESTION]Show me how to set up the Windows Task Scheduler to keep bot_manager.py running 24/7.[/PROMPT_SUGGESTION]
