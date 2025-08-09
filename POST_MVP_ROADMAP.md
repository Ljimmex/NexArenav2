# POST_MVP_ROADMAP.md

## 🎯 Cel post-MVP
Rozbudowa aplikacji po wydaniu MVP o dodatkowe formaty turniejowe, automatyzacje, personalizacje, integracje streamingowe i funkcje społecznościowe.  
Celem jest zwiększenie użyteczności dla organizatorów oraz atrakcyjności dla graczy i widzów.

---

## 🗂 Etap 1 — Rozszerzenie funkcjonalności turniejów (2–3 sprinty)

### Sprint PMVP-1 — Nowe formaty turniejowe
**Cele:**
- Dodanie **Double Elimination** (pełna obsługa drabinki).
- Dodanie **Round Robin** z tabelą punktową.
- Możliwość mieszania formatów w turnieju (np. Round Robin + Playoff Single/Double Elimination).

**Deliverables:**
- Generator Double Elimination.
- Generator Round Robin z tabelą rankingową.
- Obsługa hybrydowych turniejów.

**Priorytet:** Wysoki  
**ETA:** 3 tygodnie

---

### Sprint PMVP-2 — Integracja API gier
**Cele:**
- Integracja z **CS2 API** (auto-import wyników z serwera).
- Integracja z **Steam Web API** (profil gracza, statystyki).
- Wsparcie dla integracji innych gier w przyszłości.

**Deliverables:**
- Automatyczne zapisywanie wyników meczu.
- Powiązanie gracza z kontem Steam.
- Konfiguracja serwera meczowego w panelu admina.

**Priorytet:** Wysoki  
**ETA:** 2 tygodnie

---

### Sprint PMVP-3 — Historia turniejów i profile graczy
**Cele:**
- Strona profilu gracza z:
  - historią turniejów,
  - statystykami (K/D ratio, win rate, mapy wygrane/przegrane).
- Historia drużyn:
  - poprzednie składy,
  - osiągnięcia.
- Filtry i wyszukiwarka turniejów archiwalnych.

**Deliverables:**
- Publiczne profile graczy i drużyn.
- Widok historii turniejów z możliwością sortowania.

**Priorytet:** Średni  
**ETA:** 2 tygodnie

---

## 🗂 Etap 2 — Gamifikacja i personalizacja (2 sprinty)

### Sprint PMVP-4 — System nagród i poziomów
**Cele:**
- Punkty doświadczenia (XP) za mecze i osiągnięcia.
- Poziomy konta z odznakami.
- Misje tygodniowe i miesięczne (np. „Rozegraj 5 meczów w tygodniu”).

**Deliverables:**
- API punktów XP i poziomów.
- UI poziomu i odznak.
- Moduł misji.

**Priorytet:** Średni  
**ETA:** 2 tygodnie

---

### Sprint PMVP-5 — Personalizowane profile drużyn
**Cele:**
- Logo, baner i kolory drużyny.
- Strona drużyny z newsami i osiągnięciami.
- Sekcja komentarzy/fanpage dla drużyny.

**Deliverables:**
- Edytor profilu drużyny.
- Publiczna strona z informacjami o drużynie.

**Priorytet:** Średni  
**ETA:** 2 tygodnie

---

## 🗂 Etap 3 — Społeczność i integracje (ciągły rozwój)

### Sprint PMVP-6 — Integracje streamingowe
**Cele:**
- Osadzanie streamów z **Twitch** i **YouTube** na stronie meczu.
- Panel komentatora z dostępem do danych meczu w czasie rzeczywistym.
- Wsparcie dla stream overlay (API wyników w JSON).

**Deliverables:**
- Embed player Twitch/YouTube.
- API dla overlayów streamerskich.

**Priorytet:** Wysoki  
**ETA:** 2 tygodnie

---

### Sprint PMVP-7 — Funkcje społecznościowe
**Cele:**
- System znajomych i drużyn rezerwowych.
- Prywatne wiadomości między graczami.
- Feed aktywności (np. „Drużyna X wygrała turniej Y”).

**Deliverables:**
- Moduł znajomych.
- Moduł wiadomości prywatnych.
- Tablica aktywności.

**Priorytet:** Niski/Średni  
**ETA:** 3 tygodnie

---

## 📌 Priorytety post-MVP
1. **Nowe formaty turniejowe** (Double Elimination, Round Robin, hybrydowe).
2. **Integracje z API gier** (CS2, Steam).
3. **Profile i historia turniejów**.
4. **Gamifikacja** (XP, odznaki, misje).
5. **Personalizacja drużyn**.
6. **Integracje streamingowe**.
7. **Funkcje społecznościowe**.

---

## 📅 Harmonogram (proponowany)
| Etap     | Sprinty           | Czas trwania | Zakres                                                                 |
|----------|------------------|--------------|------------------------------------------------------------------------|
| Etap 1   | PMVP-1 do PMVP-3 | ~7 tygodni   | Nowe formaty, API gier, profile i historia                             |
| Etap 2   | PMVP-4 do PMVP-5 | ~4 tygodnie  | Gamifikacja i personalizacja                                           |
| Etap 3   | PMVP-6 do PMVP-7 | ~5 tygodni   | Integracje streamingowe, społeczność                                   |

---

## ✅ Kryteria ukończenia Post-MVP
- Obsługa min. 4 formatów turniejowych.
- Automatyczny zapis wyników z serwera gry.
- Publiczne profile graczy i drużyn z histor
