# 👗 StyleHub Frontend (Client)

The frontend for **StyleHub** is built with **React 19**, **Vite**, **Tailwind CSS**, and **Ant Design**.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `VITE_API_URL` points to your active backend (default: `http://localhost:5000`):
```env
VITE_API_URL=http://localhost:5000
```

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
The compiled static assets will be output to the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

---

## 📦 Key Libraries & Technologies
- **React 19**: Core UI framework
- **Vite 8**: Next-generation frontend tooling and HMR dev server
- **Tailwind CSS 3.4**: Utility-first styling with responsive design
- **Ant Design 6**: Enterprise UI component library (forms, modals, tables, sliders)
- **Lucide React**: Modern iconography
- **React Router DOM 7**: Client-side routing with role-based route guards
- **Recharts**: Business intelligence analytics & interactive visual charts
- **Day.js**: Lightweight date parsing and range filtering
