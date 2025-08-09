# Przewodnik po zasobach graficznych

## Struktura folderów

```
public/
├── banners/                    # Bannery turniejów
│   └── default-tournament-banner.svg
├── icons/                      # Ikony aplikacji
│   ├── app-icon.png           # Główna ikona aplikacji
│   ├── games/                 # Ikony gier
│   │   ├── cs2.png
│   │   ├── valorant.png
│   │   ├── lol.png
│   │   ├── dota2.png
│   │   ├── rocket-league.png
│   │   └── overwatch.png
│   ├── regions/               # Ikony regionów
│   │   ├── europe.png
│   │   ├── north-america.png
│   │   ├── south-america.png
│   │   ├── asia.png
│   │   ├── oceania.png
│   │   ├── africa.png
│   │   └── global.png
│   ├── formats/               # Ikony formatów turniejów
│   │   ├── single-elimination.svg
│   │   ├── double-elimination.svg
│   │   ├── round-robin.svg
│   │   └── swiss.svg
│   └── platforms/             # Ikony platform (konsole/PC)
│       ├── pc.svg
│       ├── playstation.png
│       ├── xbox.svg
│       ├── nintendo.svg
│       ├── mobile.svg
│       └── cross-platform.svg
├── images/                     # Obrazy ogólne
│   └── demo-avatar.png        # Domyślny avatar użytkownika (SVG)
├── logos/                      # Loga
│   └── app-logo.svg          # Logo aplikacji
├── favicon.svg                 # Favicon
├── placeholder.svg             # Placeholder dla brakujących obrazów
└── team-avatar.png            # Domyślny avatar zespołu (SVG)
```

## Zasoby do stworzenia/zastąpienia

### 1. Ikony gier (32x32px, SVG)
- ✅ `icons/games/cs2.png` - Counter-Strike 2
- ✅ `icons/games/valorant.png` - Valorant  
- ✅ `icons/games/lol.png` - League of Legends
- ✅ `icons/games/dota2.png` - Dota 2
- ✅ `icons/games/rocket-league.png` - Rocket League
- ✅ `icons/games/overwatch.png` - Overwatch 2

### 1a. Ikony regionów (24x24px, SVG)
- ✅ `icons/regions/europe.png` - Europa
- ✅ `icons/regions/north-america.png` - Ameryka Północna
- ✅ `icons/regions/south-america.png` - Ameryka Południowa
- ✅ `icons/regions/asia.png` - Azja
- ✅ `icons/regions/oceania.png` - Oceania
- ✅ `icons/regions/africa.png` - Afryka
- ✅ `icons/regions/global.png` - Globalny

### 1b. Ikony formatów turniejów (24x24px, SVG)
- ✅ `icons/formats/single-elimination.svg` - Pojedyncza eliminacja
- ✅ `icons/formats/double-elimination.svg` - Podwójna eliminacja
- ✅ `icons/formats/round-robin.svg` - System kołowy
- ✅ `icons/formats/swiss.svg` - System szwajcarski

### 1c. Ikony platform (24x24px, SVG)
- ✅ `icons/platforms/pc.svg` - PC (Windows/Mac/Linux)
- ✅ `icons/platforms/playstation.png` - PlayStation
- ✅ `icons/platforms/xbox.svg` - Xbox
- ✅ `icons/platforms/nintendo.svg` - Nintendo Switch
- ✅ `icons/platforms/mobile.svg` - Mobile (iOS/Android)
- ✅ `icons/platforms/cross-platform.svg` - Cross-platform

### 2. Bannery turniejów (640x160px, SVG)
- ✅ `banners/default-tournament-banner.png` - Banner dla tła strony szczegółów turnieju
- ✅ `banners/Tournament-card.png` - Banner dla kart turniejów (main page, tournaments page)
- ✅ `banners/cs2-tournament.webp` - Banner dla turniejów CS2
- ✅ `banners/valorant-tournament.png` - Banner dla turniejów Valorant
- ❌ `banners/lol-tournament.svg` - Banner dla turniejów LoL
- ❌ `banners/dota2-tournament.svg` - Banner dla turniejów Dota 2
- ❌ `banners/rocket-league-tournament.svg` - Banner dla turniejów Rocket League
- ❌ `banners/overwatch-tournament.svg` - Banner dla turniejów Overwatch 2
- ✅ `banners/profile-banner.png` - Banner dla profili użytkowników

### 3. Avatary i obrazy (SVG preferowane)
- ✅ `images/Avatar1.png` - Avatar 1 do wyboru w ustawieniach profilu
- ✅ `images/Avatar2.png` - Avatar 2 do wyboru w ustawieniach profilu
- ✅ `images/Avatar3.png` - Avatar 3 do wyboru w ustawieniach profilu
- ✅ `images/Avatar4.png` - Avatar 4 do wyboru w ustawieniach profilu
- ✅ `images/Avatar5.png` - Avatar 5 do wyboru w ustawieniach profilu
- ✅ `team-avatar.png` - Domyślny avatar zespołu (48x48px)
- ✅ `organizer-avatar.webp` - Domyślny avatar organizatora turnieju 
- ❌ `images/tournament-placeholder.svg` - Placeholder dla obrazów turniejów
- ❌ `images/team-placeholder.svg` - Placeholder dla obrazów zespołów

### 4. Logo i branding
- ✅ `logos/app-logo.svg` - Logo aplikacji (120x32px)
- ✅ `icons/app-icon.svg` - Ikona aplikacji (32x32px)
- ✅ `favicon.svg` - Favicon (32x32px)
- ❌ `logos/app-logo-white.svg` - Białe logo na ciemne tła
- ❌ `logos/app-logo-dark.svg` - Ciemne logo na jasne tła

### 5. Tła i wzory
- ❌ `images/backgrounds/hero-bg.svg` - Tło dla sekcji hero
- ❌ `images/backgrounds/tournament-bg.svg` - Tło dla kart turniejów
- ❌ `images/patterns/grid.svg` - Wzór siatki
- ❌ `images/patterns/dots.svg` - Wzór kropek

## Gdzie są używane

### Avatary użytkowników
- `components/header.tsx` - linie 176, 193
- Ścieżka: `/images/demo-avatar.png`

### Bannery turniejów  
- `app/main/page.tsx` - wyświetlanie w kartach turniejów (linie 304-308, 419-423)
- `app/tournaments/page.tsx` - linie 200, 207
- `components/tournament-header.tsx` - linia 60
- Ścieżki: `tournament.banner_url`, `/banners/tournament-card.png` lub `/banners/default-tournament-banner.png`

### Avatary zespołów
- `app/main/page.tsx` - wyświetlanie w kartach turniejów (linie 339, 428)
- `app/tournaments/page.tsx` - linia 276
- Ścieżka: `/images/team-avatar.png`

### Logo organizatorów
- `app/main/page.tsx` - wyświetlanie w kartach turniejów (linie 325-332)
- `app/tournaments/page.tsx` - linia 249
- Ścieżka: `organizer.logo_url` lub `/images/organizer-avatar.webp`

### Logo turniejów
- `components/tournament-header.tsx` - linia 131
- Ścieżka: `tournament.logoUrl`

### Ikony gier
- `components/main-content.tsx` - linie 15, 23, 31, 39
- `app/tournaments/page.tsx` - sekcja filtrów gier
- Ścieżki: `/icons/games/cs2.png`, `/icons/games/valorant.png`, `/icons/games/lol.png`, `/icons/games/dota2.png`

### Ikony regionów
- `app/tournaments/create/page.tsx` - wybór regionu turnieju
- `app/tournaments/[id]/page.tsx` - wyświetlanie regionu turnieju
- Ścieżki: `/icons/regions/{region}.png`

### Ikony formatów turniejów
- `app/main/page.tsx` - wyświetlanie formatów w kartach turniejów (linie 309-319, 424-434)
- `app/tournaments/create/page.tsx` - wybór formatu turnieju
- `app/tournaments/[id]/page.tsx` - wyświetlanie formatu turnieju
- `components/tournament-card.tsx` - ikona formatu na karcie turnieju
- Ścieżki: `/icons/formats/{format}.svg`

### Ikony platform
- `app/tournaments/create/page.tsx` - wybór platform turnieju
- `app/tournaments/[id]/page.tsx` - wyświetlanie dostępnych platform
- `components/tournament-card.tsx` - ikony platform na karcie turnieju
- `app/tournaments/page.tsx` - filtry według platform
- Ścieżki: `/icons/platforms/{platform}.svg` (większość SVG, PlayStation jako PNG)

## Zalecenia techniczne

### Format plików
- **SVG** - preferowany dla wszystkich ikon, logo i grafik wektorowych
- **PNG** - tylko dla zdjęć i obrazów rastrowych
- **WebP** - dla zoptymalizowanych zdjęć (przyszłość)

### Rozmiary
- Ikony gier: 32x32px
- Avatary użytkowników: 40x40px  
- Avatary zespołów: 48x48px
- Bannery turniejów: 640x160px
- Logo aplikacji: 120x32px
- Favicon: 32x32px

### Kolory
- Główny: #06B6D4 (cyan-500)
- Akcent: #3B82F6 (blue-500)
- Tło: #0F1317 (bardzo ciemny)
- Tekst: #FFFFFF (biały)
- Tekst drugorzędny: #9CA3AF (gray-400)

### Optymalizacja
- SVG: minimalizowane, bez niepotrzebnych metadanych
- PNG: skompresowane, odpowiedni rozmiar
- Wszystkie pliki < 50KB dla lepszej wydajności

## Następne kroki

1. ✅ Stwórz brakujące ikony gier (Dota 2, Rocket League, Overwatch)
2. ✅ **Stwórz ikony regionów** (Europa, Ameryka Północna, Ameryka Południowa, Azja, Oceania, Afryka, Globalny)
3. ✅ **Stwórz ikony formatów turniejów** (Pojedyncza eliminacja, Podwójna eliminacja, System kołowy, System szwajcarski)
4. ✅ **Stwórz ikony platform** (PC, PlayStation, Xbox, Nintendo Switch, Mobile, Cross-platform)
5. Dodaj warianty logo (białe/ciemne)
6. Stwórz bannery specyficzne dla gier
7. Dodaj tła i wzory dla lepszego designu
8. Zoptymalizuj wszystkie pliki pod kątem rozmiaru