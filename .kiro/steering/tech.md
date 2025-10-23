# Technology Stack

## Architecture

**Type**: Vanilla JavaScript SPA (Single Page Application)  
**Pattern**: Class-based architecture with state management  
**Storage**: LocalStorage (primary) + Supabase (optional cloud sync)

## Core Technologies

- **HTML5**: Semantic markup with ARIA attributes for accessibility
- **CSS3**: Custom properties (CSS variables), animations, responsive design
- **Vanilla JavaScript (ES6+)**: No framework dependencies for core functionality
- **Supabase**: Optional backend for authentication and cloud sync
  - SDK: `@supabase/supabase-js@2` (loaded via CDN)

## Key Libraries

- **Supabase JS SDK**: Cloud database and authentication (optional feature)
- **No build tools**: Direct browser execution, no bundler required

## Code Architecture

### Class Structure

- `LocalStorageManager`: Data persistence and validation
- `AppStateManager`: Application state and event system
- `OnboardingSystem`: New user tutorial flow
- `SettingsPanel`: User preferences management
- `SupabaseClient`: Cloud sync and authentication (optional)
- `NotificationSystem`: Browser notifications
- `ThemeSystem`: Light/dark mode management
- `DashboardSystem`: Statistics and charts

### Data Models

- `DEFAULT_GAME_DATA`: Level, exp, water amounts, history, achievements
- `DEFAULT_SETTINGS`: Daily goals, quick buttons, notifications, theme
- `ACHIEVEMENT_DEFINITIONS`: Achievement metadata
- `CHARACTER_STAGES`: Character evolution stages

### State Management

- Event-driven architecture with listeners for: `dataChange`, `levelUp`, `achievementUnlock`, `dailyGoalComplete`
- Centralized state in `AppStateManager`
- Automatic persistence to LocalStorage

## File Structure

```
/
├── index.html              # Main application entry
├── script.js               # Core application logic (~6000+ lines)
├── style.css               # Styles with CSS variables
├── js/
│   ├── supabase-client.js  # Supabase integration
│   └── auth-ui.js          # Authentication UI
├── supabase/
│   ├── config.js           # Supabase credentials (gitignored)
│   ├── config.example.js   # Config template
│   ├── schema.sql          # Database schema
│   └── README.md           # Setup instructions
└── tests/
    ├── test-unit.html      # Unit tests
    ├── test-integration.html
    ├── test-accessibility.html
    ├── test-dashboard.html
    ├── test-export.html
    ├── test-performance-offline.html
    ├── test-supabase.html
    └── TESTING.md
```

## Development Workflow

### Running Locally

No build step required. Open `index.html` directly in browser or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

### Testing

Open test files directly in browser:
- Unit tests: `tests/test-unit.html`
- Integration tests: `tests/test-integration.html`
- Accessibility: `tests/test-accessibility.html`

No test runner needed - tests execute in browser with custom test framework.

### Supabase Setup (Optional)

1. Create Supabase project at https://supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Copy `supabase/config.example.js` to `supabase/config.js`
4. Add Project URL and anon key to config

## Browser Support

- Modern browsers with ES6+ support
- LocalStorage API required
- Optional: Notification API, Service Workers

## Accessibility Standards

- WCAG 2.1 Level AA compliance
- Full keyboard navigation
- ARIA labels and roles
- Screen reader tested
- Focus management
- Skip links for navigation
