Kepgeneralo
# AI-alapú Képgeneráló Webalkalmazás / AI-Powered Image Generation Web App

## 🇭🇺 Magyar nyelvű leírás

### Projekt bemutatása
Ez egy modern, teljes értékű webalkalmazás, amely a mesterséges intelligencia (FLUX modell) segítségével teszi lehetővé képek generálását és szerkesztését. A rendszer aszinkron módon kommunikál az AI modellekkel, támogatja a felhasználói fiókok kezelését, a közösségi interakciókat és az aktivitás követését.

### Alkalmazott technológiák
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
- **AI Modell:** FLUX.1 (Replicate API-n keresztül)
- **Állapotkezelés:** React Context API

### Könyvtárszerkezet és modulok
- `src/components/`: Újrafelhasználható UI komponensek (pl. Galéria, Képfeltöltő, Hőtérkép).
- `src/contexts/`: Globális állapotkezelés (Bejelentkezés, Nyelvválasztás, Téma).
- `src/pages/`: Az alkalmazás fő oldalai (Főoldal, Felfedezés, Profil).
- `src/lib/`: Külső szolgáltatások konfigurációja (Supabase kliens, segédfüggvények).
- `supabase/functions/`: Szerveroldali TypeScript függvények az AI modellek meghívásához.
- `supabase/migrations/`: Az adatbázis sémáját és biztonsági szabályait (RLS) definiáló SQL fájlok.

### Használati útmutató
1. **Regisztráció/Bejelentkezés:** Az alkalmazás használatához fiók létrehozása szükséges. FONTOS, hogy ezt emailben visszaigazolja
2. **Képgenerálás (Create):** Írjon be egy szöveges leírást (prompt) kizárólagosan angol nyelven, vagy használja a "Surprise Me" gombot inspirációért.
3. **Képszerkesztés (Edit):** Töltsön fel egy referenciaképet, adjon meg egy módosítási utasítást, és állítsa be az erősséget.
4. **Közösség:** A "Explore" fül alatt böngészhet mások nyilvános képei között, kedvelheti és letöltheti azokat.
5. **Profil:** Kövesse nyomon saját generálásait és aktivitási statisztikáit.

---

## 🇺🇸 English Description

### Project Overview
A modern, full-stack web application that leverages Artificial Intelligence (FLUX model) to generate and edit images. The system communicates asynchronously with AI models and supports user authentication, social interactions, and activity tracking.

### Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
- **AI Model:** FLUX.1 (via Replicate API)
- **State Management:** React Context API

### Folder Structure & Modules
- `src/components/`: Reusable UI components (Gallery, Image Upload, Heatmap, etc.).
- `src/contexts/`: Global state management (Auth, Language, Theme).
- `src/pages/`: Main application views (Home, Explore, Profile).
- `src/lib/`: External service configurations (Supabase client, utilities).
- `supabase/functions/`: Server-side TypeScript functions for AI model invocation.
- `supabase/migrations/`: SQL files defining database schema and security rules (RLS).

### Usage Guide
1. **Sign Up/Login:** Create an account to access the application.
2. **Image Generation (Create):** Enter a text prompt or use the "Surprise Me" button for inspiration.
3. **Image Editing (Edit):** Upload a reference image, provide an edit prompt, and adjust the strength.
4. **Community:** Browse public images in the "Explore" tab, like them, or download them.
5. **Profile:** Track your own generations and view activity statistics.
