# ☕ JAY CAFÉ — Full-Stack POS System

**Frontend:** React + Vite → Vercel  
**Backend:** Node.js + Express → Railway / Render  
**Database:** MongoDB Atlas (free tier)  

---

## 📁 Project Structure

```
jay-cafe-pos/              ← Frontend (React + Vite)
├── src/
│   ├── components/
│   │   ├── Login.jsx      PIN keypad login
│   │   ├── Navbar.jsx     Desktop nav + Mobile bottom nav
│   │   ├── POS.jsx        Main ordering screen
│   │   ├── History.jsx    Order history by date
│   │   ├── Products.jsx   Add/edit/delete menu items
│   │   └── Settings.jsx   Café config, GST, printer, PIN
│   ├── services/
│   │   ├── api.js         Axios API client
│   │   └── print.js       Thermal bill print utility
│   ├── context/
│   │   └── AuthContext.jsx JWT auth state
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
└── .env.example

jay-cafe-backend/          ← Backend (Node.js + Express)
├── models/
│   ├── Product.js         Mongoose schema
│   ├── Order.js           With auto bill number
│   └── Settings.js        Café config
├── routes/
│   ├── auth.js            PIN login → JWT
│   ├── products.js        Full CRUD
│   ├── orders.js          Place + history + summary
│   └── settings.js        Get/update settings
├── middleware/
│   └── auth.js            JWT verification
├── server.js              Express app + MongoDB seed
└── .env.example
```

---

## 🚀 Local Setup (Step by Step)

### Step 1 — MongoDB Atlas (Free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free account → **Create Free Cluster** (M0)
3. Add a database user (username + password — save these!)
4. In Network Access → Add IP Address → **Allow from Anywhere** (`0.0.0.0/0`)
5. Click **Connect** → **Drivers** → Copy the connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/jaycafe
   ```

### Step 2 — Backend Setup

```bash
cd jay-cafe-backend

# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Edit .env — fill in:
# MONGODB_URI=mongodb+srv://user:pass@cluster0.xxx.mongodb.net/jaycafe
# JWT_SECRET=any_long_random_string_here
# FRONTEND_URL=http://localhost:5173

# Start backend
npm run dev
```

Server starts on `http://localhost:5000`  
First run auto-seeds 16 products + default settings.

### Step 3 — Frontend Setup

```bash
cd jay-cafe-pos

# Install dependencies
npm install

# Create .env from template  
cp .env.example .env

# Edit .env:
# VITE_API_URL=http://localhost:5000

# Start frontend
npm run dev
```

Frontend at `http://localhost:5173`  
**Default PIN: `1234`**

---

## 🌐 Deploy to Production

### Backend → Railway (Recommended, Free tier)

1. Push `jay-cafe-backend/` to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secret_here
   FRONTEND_URL=https://your-app.vercel.app
   PORT=5000
   NODE_ENV=production
   ```
5. Railway gives you a URL like: `https://jay-cafe-backend.up.railway.app`

### Alternative Backend → Render (Free tier)

1. Push to GitHub
2. [render.com](https://render.com) → New Web Service → Connect repo
3. Build Command: `npm install`  
   Start Command: `node server.js`
4. Add same environment variables

### Frontend → Vercel

1. Push `jay-cafe-pos/` to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add Environment Variable:
   ```
   VITE_API_URL=https://jay-cafe-backend.up.railway.app
   ```
4. Deploy → Your app is live!

---

## 📱 Mobile Support

The app is fully responsive:

| Screen | Layout |
|---|---|
| Desktop (>640px) | Side bill panel + top navbar |
| Mobile (<640px) | Full grid + floating cart button + bottom sheet cart + bottom navbar |

Works great on:
- iPhone / Android browsers
- iPad / Android tablets
- Any laptop/desktop

Add to home screen on iPhone:
> Safari → Share → Add to Home Screen

---

## 🖨️ Thermal Printer Setup

### Connect Printer
- **USB**: Plug in → Set as default printer in OS
- **Bluetooth**: Pair → Set as default
- **Wi-Fi LAN**: Add as network printer

### Print Dialog Settings (when bill popup opens)
```
Printer      → Your thermal printer
Paper size   → Custom: 58 × Auto  (or 80 × Auto mm)
Margins      → None / Minimum
Scale        → 100%
Headers/Footers → OFF
Background   → ON
```

### Tested Printers
- Xprinter XP-58IIH / XP-80C
- Rongta RP80USE
- EPSON TM-T20 / TM-T82
- Generic ESC/POS 58mm/80mm printers

---

## 🔌 API Reference

```
POST /api/auth/login          { pin } → { token, cafeName }
POST /api/auth/verify         { token } → { valid }

GET  /api/products            → all active products
POST /api/products            [auth] Create product
PUT  /api/products/:id        [auth] Update product
DEL  /api/products/:id        [auth] Delete product
PATCH /api/products/:id/toggle [auth] Show/hide product

POST /api/orders              [auth] Place order → prints bill
GET  /api/orders?date=YYYY-MM-DD [auth] List orders
GET  /api/orders/today        [auth] Today's stats
GET  /api/orders/summary?days=30 [auth] Revenue by date

GET  /api/settings            Public settings (name, address)
GET  /api/settings/full       [auth] Full settings inc. PIN
PUT  /api/settings            [auth] Update settings

GET  /api/health              Health check
```

---

## 🔒 Security Notes

- JWT tokens expire after 12 hours (stored in `sessionStorage`, not `localStorage`)
- Tokens are NOT persisted across browser tabs by default
- PIN is stored as plain text in DB (suitable for small café; can upgrade to bcrypt)
- Server-side order total recalculation prevents price tampering

---

## 🧪 Test the Setup

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}'

# Get products
curl http://localhost:5000/api/products
```

---

## 🔮 Future Upgrades

- [ ] Multiple staff accounts with roles
- [ ] Table management (Table 1, Table 2…)
- [ ] Kitchen Order Ticket (KOT) separate printer
- [ ] WhatsApp / SMS bill sharing
- [ ] UPI/QR payment on bill
- [ ] Daily/weekly reports dashboard
- [ ] Low stock alerts
- [ ] PWA with offline queue (sync when back online)
