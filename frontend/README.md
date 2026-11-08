# AKSHARARECOVER AI — Frontend Application

**The Living Archive — Heritage Botanical Design System**  
**Developed by Team SCRIPTORIA** • *"Bringing Forgotten Knowledge Back to Life."*

---

## Visual Identity & Design Tokens

The frontend uses the **Heritage Botanical** five-colour palette paired with deep archival charcoal surfaces (`src/index.css`):

| Token | Hex | Purpose |
|---|---|---|
| `--tea-green` | `#CCD5AE` | Primary accents, active controls, primary actions |
| `--beige` | `#E9EDC9` | Secondary surfaces, comparison indicators |
| `--cornsilk` | `#FEFAE0` | High-contrast headings, readable light surfaces |
| `--papaya-whip` | `#FAEDCD` | Secondary highlights, caution states |
| `--light-bronze` | `#D4A373` | Heritage accents, seals, metadata emphasis |
| `--background` | `#101614` | Primary canvas background |
| `--background-secondary` | `#17211d` | Elevated panel & card background |
| `--surface` | `#1c2923` | Interactive surface & input background |
| `--surface-border` | `#35443a` | Structural borders & hairlines |

### Typography
- **Headings**: `Space Grotesk`
- **Editorial Heritage Titles**: `Cormorant Garamond`
- **Body Copy**: `Inter`
- **Technical Metadata & Telemetry**: `IBM Plex Mono`

---

## Application Routes

### Informational Pages
- `/` — **Home**: Hero section, interactive 7-scene `CinematicProcessingMovie`, 5-stage pipeline overview, and preservation impact.
- `/about` — **About Us**: Project vision, cultural preservation mission, and Team SCRIPTORIA architectural principles.
- `/ai-model` — **AI Model**: Technical breakdown of the 5-stage computer vision, OCR, translation, and QR heritage record pipeline.
- `/importance` — **Importance**: Historical value of Kerala palm-leaf manuscripts (`Taliola`) and digital preservation urgency.

### Authenticated Workspace Routes
- `/login` & `/register` — User authentication with session persistence and CSRF protection.
- `/my-manuscripts` — Personal manuscript repository with search, status filtering, sorting, and JSON export.
- `/profile` — Archivist account details and live database manuscript statistics.
- `/analyse` — Manuscript upload, preview, metadata entry, and pipeline launch.
- `/results/:id` — 5-stage digital manuscript research report (`Stage01Enhancement` through `Stage05HeritageRecord`).
- `/heritage-record/:id` — Certified Digital Heritage Record & QR destination view.

---

## Development & Build Commands

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start Vite development server (http://localhost:5173)
npm run dev

# Run static analysis linter (oxlint)
npm run lint

# Build production bundle (dist/)
npm run build
```
