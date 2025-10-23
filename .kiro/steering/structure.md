# Project Structure & Conventions

## File Organization

```
waterlog/
├── index.html              # Main entry point with semantic HTML
├── script.js               # Monolithic app logic (~6000+ lines)
├── style.css               # Global styles with CSS variables
├── waterlog.txt            # Project requirements/notes
├── LICENSE
├── README.md
│
├── js/                     # JavaScript modules
│   ├── supabase-client.js  # Supabase client wrapper
│   └── auth-ui.js          # Authentication UI components
│
├── supabase/               # Backend configuration
│   ├── config.js           # Credentials (gitignored)
│   ├── config.example.js   # Template for config
│   ├── schema.sql          # PostgreSQL schema
│   └── README.md           # Setup guide
│
└── tests/                  # Browser-based tests
    ├── test-unit.html
    ├── test-integration.html
    ├── test-accessibility.html
    ├── test-dashboard.html
    ├── test-export.html
    ├── test-performance-offline.html
    ├── test-supabase.html
    └── TESTING.md
```

## Code Organization in script.js

The main `script.js` file follows a structured layout with clear section markers:

1. **Constants** (`// ==== 常數定義 ====`)
   - `ACHIEVEMENT_DEFINITIONS`
   - `CHARACTER_STAGES`
   - `DEFAULT_GAME_DATA`
   - `DEFAULT_SETTINGS`

2. **Core Classes** (in order)
   - `LocalStorageManager` - Data persistence layer
   - `AppStateManager` - State management
   - `OnboardingSystem` - Tutorial system
   - `SettingsPanel` - Settings UI
   - `NotificationSystem` - Browser notifications
   - `ThemeSystem` - Theme switching
   - `DashboardSystem` - Statistics/charts
   - `ExportSystem` - Data export/import

3. **Global Functions**
   - `addWater(amount)` - Core water tracking
   - `updateUI()` - UI refresh
   - `showCelebration(message)` - Animations
   - `initializeApp()` - App bootstrap

4. **Event Listeners & Initialization**
   - DOM ready handlers
   - Global event bindings

## Naming Conventions

### JavaScript

- **Classes**: PascalCase (e.g., `LocalStorageManager`, `AppStateManager`)
- **Functions**: camelCase (e.g., `addWater`, `updateUI`, `showCelebration`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_GAME_DATA`, `CHARACTER_STAGES`)
- **Variables**: camelCase (e.g., `gameData`, `currentUser`, `isOnline`)
- **Private methods**: Prefix with underscore (convention, not enforced)

### CSS

- **Classes**: kebab-case (e.g., `.drink-btn`, `.progress-bar`, `.custom-input-card`)
- **IDs**: camelCase (e.g., `#dailyProgress`, `#expFill`, `#customAmount`)
- **CSS Variables**: kebab-case with `--` prefix (e.g., `--bg-gradient-start`, `--card-shadow`)

### HTML

- **IDs**: camelCase for JavaScript targets (e.g., `id="todayAmount"`)
- **Classes**: kebab-case for styling (e.g., `class="quick-buttons"`)
- **ARIA labels**: Traditional Chinese with clear descriptions

## Code Style Guidelines

### JavaScript

- Use ES6+ features (classes, arrow functions, template literals, destructuring)
- Prefer `const` over `let`, avoid `var`
- Use JSDoc-style comments for class methods
- Section headers use `// ==== Section Name ====` format
- Error handling with try-catch blocks
- Validate all user inputs
- Always check for null/undefined before DOM manipulation

### HTML

- Semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<nav>`)
- ARIA attributes for accessibility (`role`, `aria-label`, `aria-live`)
- Skip links for keyboard navigation
- Proper heading hierarchy (h1 → h2 → h3)
- Form labels associated with inputs

### CSS

- CSS custom properties for theming
- Mobile-first responsive design
- Animations with `@keyframes`
- Focus-visible for keyboard navigation
- Dark theme support via `.dark-theme` class
- Consistent spacing using CSS variables

## Data Flow

1. **User Action** → Button click or input
2. **Function Call** → `addWater()`, `updateSettings()`, etc.
3. **State Update** → `AppStateManager.updateGameData()`
4. **Persistence** → `LocalStorageManager.saveGameData()`
5. **Event Notification** → Listeners triggered (`dataChange`, `levelUp`, etc.)
6. **UI Update** → DOM manipulation to reflect new state
7. **Optional Sync** → `SupabaseClient` syncs to cloud if authenticated

## Storage Keys

### LocalStorage

- `waterGameData` - Main game state
- `lastPlayDate` - Last active date for daily reset
- `appSettings` - User preferences
- `onboardingCompleted` - Tutorial completion flag
- `waterHistory_{date}` - Historical daily totals

### Supabase Tables

- `user_settings` - User preferences
- `user_progress` - Level and EXP
- `water_records` - Individual drink records
- `achievements` - Unlocked achievements
- `daily_stats` - Aggregated daily data

## Testing Approach

- **No test framework** - Custom HTML test pages
- **Manual execution** - Open in browser, click buttons
- **Visual feedback** - Green ✓ for pass, Red ✗ for fail
- **Test categories**: Unit, Integration, Accessibility, Performance, Supabase
- **Browser testing** - Test in Chrome, Firefox, Safari, Edge

## Accessibility Patterns

- `.sr-only` class for screen reader only content
- `aria-live` regions for dynamic updates
- `role` attributes for semantic meaning
- Focus management in modals/overlays
- Keyboard shortcuts documented
- Skip links at page top
- High contrast focus indicators

## Common Patterns

### Creating Modals/Overlays

```javascript
const overlay = document.createElement('div');
overlay.style.cssText = `position: fixed; ...`;
const content = document.createElement('div');
content.innerHTML = `...`;
overlay.appendChild(content);
document.body.appendChild(overlay);
```

### Event Listeners

```javascript
appState.addEventListener('levelUp', (data) => {
    showCelebration(`🎉 升級到 Lv.${data.level}！`);
});
```

### Data Validation

```javascript
if (amount < 1 || amount > 1000) {
    throw new Error('水量必須在 1-1000ml 之間');
}
```

## Language & Localization

- **Primary**: Traditional Chinese (zh-TW)
- **UI Text**: Hardcoded in HTML/JS (no i18n framework)
- **Comments**: Mix of English and Chinese
- **Variable names**: English
- **User-facing strings**: Traditional Chinese
