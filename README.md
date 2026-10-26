# 🌾 AgriLink Ethiopia

> A full-stack agricultural marketplace connecting Ethiopian farmers, buyers, and transporters — with AI-powered crop disease detection, live market prices, weather advisory, and a multilingual assistant.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791?logo=postgresql)](https://www.postgresql.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-EfficientNet--B0-ee4c2c?logo=pytorch)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#-license)

---

## 📖 Overview

AgriLink Ethiopia is a production-grade platform that digitizes the agricultural supply chain in Ethiopia. Farmers list produce, buyers place orders, transporters handle delivery, and payments flow through Chapa — all in one place. On top of the marketplace, an AI service detects 15 crop diseases from leaf photos, a live market terminal mirrors Ethiopian commodity prices, a weather advisory pulls hyper-local Open-Meteo data, and a bilingual chatbot answers questions in English and Afaan Oromoo.

**Repository:** [github.com/Ttenae/agrilink-ethiopia](https://github.com/Ttenae/agrilink-ethiopia)

---

## ✨ Features

### 🛒 Marketplace
- Role-based accounts: **Farmer**, **Buyer**, **Transporter**, **Admin**
- Product listing with images, category, price, unit, location
- Order lifecycle: `PENDING → ACCEPTED → COMPLETED` (with `REJECTED` / `CANCELLED`)
- Chapa payment integration
- Transporter assignment and delivery status tracking
- Reviews & ratings with average score

### 🤖 AI Crop Disease Detection
- **15 disease classes** across Pepper, Potato, and Tomato
- **96.49% accuracy** using **EfficientNet-B0**
- Upload a leaf photo → disease name, confidence, description, treatment, prevention
- Full detection history stored per user

### 📈 Market Terminal
- Live Ethiopian commodity prices (Coffee, Maize, Sesame, Wheat, Teff) with a scrolling ticker tape
- Watchlist with search, sorting (name / change / price), and favorites
- Candlestick and line/area charts with toggleable **MA7 / MA25** and **RSI(14)** (overbought / oversold signal)
- OHLC legend that follows the crosshair, plus a volume panel
- Timeframes: **1m, 5m, 15m, 1H, 1D**
- Drag to pan, Ctrl/⌘ + scroll to zoom, reset zoom
- Paper trading: buy/sell, limit and market orders, quick 25/50/75/100% sizing, fee preview
- Open orders (cancellable), order history, trade history, and holdings
- Order book with spread and a live market-trades feed (both simulated)

### 🌦️ Weather Advisory
- Live data from **Open-Meteo**
- 15 Ethiopian cities (Addis Ababa, Adama, Jimma, Hawassa, Bahir Dar, Gondar, Mekelle, Dire Dawa, Harar, Arba Minch, Bishoftu, Nekemte, Asosa, Gambela, Semera)
- Temperature, condition, and forecast

### 💬 Multilingual Assistant
- **English** and **Afaan Oromoo**
- Understands typos via **Levenshtein distance** fuzzy matching
- Answers about crop prices, weather, and disease guidance
- Clearable chat history

### 💌 Real-Time Chat
- Socket.io-powered messaging between all roles
- Searchable conversation list
- New-chat dialog with user search
- Unread badges and read receipts

### 🔔 Real-Time Notifications
- Created on: new order, order accepted, order delivered, order cancelled, transporter assigned, new chat message
- Conditional red dot on the bell (only when unread > 0)
- Dedicated `/notifications` page with auto-mark-as-read

### 👤 Profiles & Avatars
- Editable profile with role-specific fields
- Avatar upload (served from `/uploads/avatars`)
- Farmer verification badge
- Stats: products, orders, rating, reviews

### 🔐 Auth & Security
- JWT + bcrypt, role-based guards
- Refresh-safe session (no logout on reload)
- 401/403 interceptor with login-page exception
- Rate-limited auth endpoints

---

## 🏗️ Architecture

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   Frontend       │─────▶│   Backend        │─────▶│   AI Service     │
│   Next.js :3000  │◀────▶│   NestJS :3005   │      │   FastAPI :8000  │
└──────────────────┘      └────────┬─────────┘      └──────────────────┘
         │                         │
         │ Socket.io               │ Prisma
         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  Real-time Chat  │      │   PostgreSQL     │
│  & Notifications │      │   :5432          │
└──────────────────┘      └──────────────────┘
```

| Service | Technology | Port |
|---|---|---|
| Frontend | Next.js + Tailwind + shadcn/ui | 3000 |
| Backend | NestJS + Prisma + PostgreSQL | 3005 |
| AI Service | Python + FastAPI + PyTorch | 8000 |

---

## 🧰 Tech Stack

**Frontend**
- Next.js (App Router), React, TypeScript
- Tailwind CSS, shadcn/ui, lucide-react
- Recharts (candlesticks, RSI, volume)
- Socket.io-client
- Sonner (toasts)

**Backend**
- NestJS, TypeScript
- Prisma ORM, PostgreSQL 18
- Passport JWT, bcrypt
- Socket.io (WebSocket gateway)
- Multer (file uploads)
- Helmet, Throttler

**AI Service**
- Python, FastAPI
- PyTorch, torchvision
- EfficientNet-B0 (transfer learning)

**Integrations**
- Chapa (payments)
- Open-Meteo (weather)
- Yahoo Finance (optional market tickers)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Python 3.10+
- npm or pnpm

### 1. Clone

```bash
git clone https://github.com/Ttenae/agrilink-ethiopia.git
cd agrilink-ethiopia
```

### 2. Backend

```bash
cd backend
npm install

# Create .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:password@localhost:5432/agrilink"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"
CHAPA_SECRET_KEY="your-chapa-key"
PORT=3005
EOF

# Set up database
npx prisma generate
npx prisma db push

# Start
npm run start:dev
```

Backend runs at `http://localhost:3005` — API at `http://localhost:3005/api`.

### 3. Frontend

```bash
cd ../frontend
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3005/api" > .env.local

npm run dev
```

Frontend runs at `http://localhost:3000`.

### 4. AI Service

```bash
cd ../ai-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

AI service runs at `http://localhost:8000`.

> **Note on the model file:** `ai-service/models/agrilink_model.pth` is ~600 MB and is **not** tracked in Git (excluded via `.gitignore`). Download it separately or retrain with `train.py`.

---

## 📁 Project Structure

```
agrilink-ethiopia/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── auth/            # JWT, register/login
│       ├── users/           # /users/me, profile, avatar upload
│       ├── products/        # Marketplace listings
│       ├── orders/          # Order lifecycle + notifications
│       ├── payments/        # Chapa integration
│       ├── transporters/    # Delivery assignment
│       ├── reviews/         # Ratings
│       ├── chat/            # Socket.io gateway + REST
│       ├── notifications/   # Bell, unread count, mark-as-read
│       ├── market/          # Commodity prices
│       ├── weather/         # Open-Meteo
│       ├── chatbot/         # Multilingual assistant
│       ├── ai/              # Proxy to FastAPI service
│       └── analytics/       # Dashboard stats
├── frontend/
│   ├── app/
│   │   ├── auth/            # login, register
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── chat/
│   │   ├── chatbot/
│   │   ├── market/
│   │   ├── weather/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── ai/disease-detection/
│   ├── components/
│   │   ├── layout/          # header, footer
│   │   └── ui/              # shadcn primitives
│   ├── context/             # AuthContext (global socket)
│   └── lib/api/             # Axios client + interceptors
└── ai-service/
    ├── main.py              # FastAPI app
    ├── predict.py           # Inference
    ├── train.py             # EfficientNet-B0 training
    ├── models/              # classes.json (weights excluded)
    └── requirements.txt
```

---

## 🔌 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Get JWT |
| `GET` | `/api/users/me` | Current user profile |
| `PATCH` | `/api/users/profile` | Update profile |
| `POST` | `/api/users/avatar` | Upload avatar |
| `GET` | `/api/products` | List products |
| `POST` | `/api/orders` | Place order |
| `PATCH` | `/api/orders/:id/status` | Update order |
| `GET` | `/api/notifications` | List notifications |
| `GET` | `/api/notifications/unread-count` | Unread count |
| `PATCH` | `/api/notifications/read-all` | Mark all read |
| `GET` | `/api/market/latest` | Latest commodity prices |
| `GET` | `/api/market/history/:commodity` | Price history |
| `GET` | `/api/weather` | Weather by region |
| `POST` | `/api/chatbot/message` | Ask the assistant |
| `DELETE` | `/api/chatbot/history` | Clear chat history |
| `POST` | `/api/ai/detect-disease` | Upload leaf photo |

---

## 🗄️ Database Models (high level)

- **User** — role-based, `avatarUrl`, relations to all profile types
- **FarmerProfile / BuyerProfile / TransporterProfile**
- **Product** — listing with quantity, price, unit, image
- **Order** — buyer, farmer, transporter, status, payment status
- **Payment** — Chapa reference
- **Commission** — 3% platform fee
- **Review** — rating + comment
- **Conversation / Message** — chat
- **Notification** — `userId, title, message, type, isRead`
- **MarketPrice** — commodity, price, date
- **ChatMessage** — chatbot history
- **DiseaseDetection** — AI results

> ⚠️ **Emoji caveat:** If your PostgreSQL instance uses `WIN1252` encoding, emojis in DB strings will crash inserts. All notification strings in the backend are emoji-free for this reason. Frontend UI emojis are safe.

---

## 🧪 Testing the Flow

1. Register a **Farmer**, a **Buyer**, and a **Transporter** (three browsers/incognito).
2. As Farmer: list a product.
3. As Buyer: place an order → Farmer sees notification → Farmer accepts → Buyer pays (Chapa sandbox) → Buyer requests transporter.
4. As Transporter: accept delivery, mark `DELIVERED`.
5. As Buyer: leave a review.
6. Open `/chat` and message across roles — notification bell lights up.
7. Open `/market` — switch timeframes, zoom, pan, and place a paper-trade order.
8. Open `/chatbot` — ask "price of maize" in English, then "gatii boqqolloo" in Afaan Oromoo.
9. Open `/ai/disease-detection` as Farmer — upload a leaf photo.

---

## 🛠️ Known Limitations

- **Model weights not in repo** — `agrilink_model.pth` (~600 MB) is excluded; download separately.
- **PostgreSQL WIN1252** — emojis in DB strings are avoided; migrate to UTF-8 to lift this.
- **Chapa in sandbox** — switch to live keys for production.
- **Market data** — simulated high-density data by default; Yahoo Finance optional.
- **Market terminal trading** — paper trading only; orders, balance, order book, and trades feed are simulated client-side and reset on refresh.
- **Chatbot** — rule-based with fuzzy matching, not an LLM.

---

## 🗺️ Roadmap

- [ ] SMS alerts via Telebirr / Ethio Telecom gateway
- [ ] Price alerts (subscribe to a crop + target price)
- [ ] Admin verification dashboard
- [ ] Delivery tracking map (Leaflet)
- [ ] Multi-language UI (next-intl)
- [ ] PWA (offline browsing + installable)
- [ ] Export orders/reports to PDF/Excel
- [ ] Telebirr payment integration
- [ ] Yield prediction model
- [ ] Persist market-terminal orders to the backend

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit (`git commit -m "feat: add your feature"`)
4. Push (`git push origin feat/your-feature`)
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Ttenae** — [github.com/Ttenae](https://github.com/Ttenae)

---

## 🙏 Acknowledgements

- [NestJS](https://nestjs.com/) · [Next.js](https://nextjs.org/) · [Prisma](https://www.prisma.io/) · [PyTorch](https://pytorch.org/)
- [Open-Meteo](https://open-meteo.com/) for free weather data
- [Chapa](https://chapa.co/) for Ethiopian payments
- [shadcn/ui](https://ui.shadcn.com/) for UI primitives
