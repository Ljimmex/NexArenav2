# Roadmap projektu Esports Tournament Management

## Cel MVP
- Dwa formaty turniejowe: Swiss i Single Elimination  
- Rejestracja użytkowników i drużyn  
- Tworzenie i zarządzanie turniejami  
- System seeding i ranking  
- Live updates meczów + chat  
- Darmowy system zakładów tokenowych  
- Panel administracyjny i system supportu  

---

## Sprint 0 — Przygotowania (1 tydzień) - Status: 100% ukończony
- Repozytorium i struktura: monorepo (optional), CI minimalny
- Konfiguracja środowisk (dev/stage/prod)
- Schemat bazy danych (wstępne modele)
- Auth: NextAuth skeleton (bez providerów finalnych)
- **Acceptance**: repo + działający boilerplate

---

## Sprint 1 (2 tygodnie) — Podstawowy backend + auth - Status: 100% ukończony
- Implementacja User model & auth (Google/Discord/Steam)
- CRUD dla teams i basic users API
- DB schema stabilization

**Deliverables:**
- Działa logowanie, tworzenie profilu, tworzenie drużyny

**KPI:** zalogowanie przez 3 providerów + utworzenie drużyny

---

## Sprint 2 (2 tygodnie) — Turnieje + frontend shell
- Backend: tournaments CRUD
- Frontend: Landing, Tournament List, Tournament Create (form)
- Admin role check

**Deliverables:**
- Możliwość tworzenia turnieju z minimalnymi opcjami

**AC:** Admin tworzy turniej, widoczny publicznie

---

## Sprint 3 (2 tygodnie) — Formats: Single Elim + bracket UI
- Backend: single-elimination bracket generator
- Frontend: Bracket component, Tournament Overview + Bracket tab

**Deliverables:**
- Generowanie bracketu z seedów, wyświetlenie i aktualizacja wyników

**AC:** Admin generuje bracket, aktualizuje wynik — bracket się aktualizuje

---

## Sprint 4 (2 tygodnie) — Formats: Swiss engine + UI
- Backend: swiss pairing engine (3 rundy flow)
- Frontend: Swiss Matches view, Standings

**Deliverables:**
- Mechanizm losowania par na rundy i aktualizacja standings

**AC:** System generuje pary per runda i oblicza standings

---

## Sprint 5 (2 tygodnie) — Matches, Live updates, Chat
- WebSocket server + events
- MatchDetails modal + live updates
- Turniejowy i meczowy chat

**Deliverables:**
- Live feed match events, chat działa

**AC:** Użytkownik obserwuje match, widzi live updates i wiadomości

---

## Sprint 6 (2 tygodnie) — Ranking & Seeding
- Ranking engine (players & teams) + seeding alg
- Manual seeding UI

**Deliverables:**
- Ranking visible, możliwość seedowania turnieju wg rankingu

---

## Sprint 7 (2 tygodnie) — Betting (token system) + Wallet
- Implement token balances (darmowe), place bet flow, bet settlement

**Deliverables:**
- Użytkownik obstawia żetony, wynik meczu rozlicza bety

**AC:** Bet history, balance update po meczu

---

## Sprint 8 (2 tygodnie) — Admin & Support Tools
- Support tickets, moderator panel, protest flow

**Deliverables:**
- Moderator może rozpatrywać zgłoszenia i zmieniać wyniki/podejmować decyzje

---

## Sprint 9 (2 tygodnie) — UX polish, analytics, tests
- Poprawki UI, performance, monitoring (Sentry)
- E2E testing

**Deliverables:**
- Przygotowanie do bety

---

## Sprint 10 — Beta release (1–2 tygodnie)
- Launch publicznej bety, feedback loop, bugfixing
- Dokumentacja dla adminów/testersów

---

## Kryteria akceptacji MVP
- Możliwość założenia konta i drużyny
- Admin może utworzyć turniej w jednym z dwóch formatów (Swiss/Single Elim)
- Zarejestrowane drużyny mogą być seedowane i przydzielone do bracketów/roundów
- Wyniki mogą być wprowadzane i publikowane (live update)
- Ranking działa i jest aktualizowany po meczach
- System zakładów tokenowych: użytkownik obstawia i saldo się aktualizuje
- Działający chat i support ticket system

---

## Ryzyka i mitigacje
- **Złożoność algorytmów (Swiss)** — rozbić na moduły i pokryć testami jednostkowymi. W wczesnej fazie użyć prostszych zasad pairingowych
- **Skalowalność Socket.IO** — użyć Redis pub/sub przy multi-instance
- **Bezpieczeństwo zakładów** — zablokować withdraw/integracje płatności (darmowe żetony)

