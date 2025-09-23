# Frontend React Application

React/TypeScript PWA for the D&D Character Sheet Generator with modern UI, mobile-responsive design, and D&D 2024 integration.

## 🎯 Current Status

### ✅ Project Infrastructure

- **React 18** with **TypeScript** scaffolding complete
- **PWA Configuration** with manifest and service worker setup
- **Styled Components** theme system configured
- **Vite Build System** for fast development and optimized builds
- **Component Architecture** organized for D&D character management

### ⚠️ Known Issues

- **Dependency Conflicts**: React Scripts compatibility issues with Node.js v22
- **Build Status**: Needs dependency resolution before development can proceed

### 🚧 In Development

- **Character Sheet Interface**: D&D 2024 compliant character creation and management
- **Backend Integration**: API connections to 705-item database and character systems
- **Mobile Optimization**: Tablet-friendly interface for gameplay sessions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended) or resolve v22 compatibility
- npm or yarn

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Configure API endpoints: REACT_APP_API_URL=http://localhost:3001
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

### Troubleshooting Build Issues

If you encounter dependency conflicts:

```bash
# Option 1: Use Node.js 18 LTS
nvm use 18
npm install

# Option 2: Force legacy peer deps
npm install --legacy-peer-deps

# Option 3: Alternative - Use Vite (recommended)
npx create-vite@latest . --template react-ts
```

## 📁 Project Structure

```text
src/
├── components/        # Reusable UI components
│   ├── common/       # Generic components (Button, Input, etc.)
│   ├── character/    # D&D character sheet components
│   ├── spells/       # Spell management interface
│   ├── items/        # Equipment and inventory
│   └── forms/        # Form components for character creation
├── pages/            # Page-level components
│   ├── CharacterCreator/  # Character creation wizard
│   ├── CharacterSheet/    # Main character sheet view
│   └── Dashboard/         # User dashboard
├── hooks/            # Custom React hooks
│   ├── useCharacter.ts    # Character data management
│   └── useD20Content.ts   # D&D content API hooks
├── services/         # API communication layer
│   ├── api.ts        # Backend API integration (705 items, 391 spells)
│   └── characters.ts # Character management service
├── types/            # TypeScript definitions
│   ├── character.ts  # Character data types
│   └── dnd.ts        # D&D content types (Items, Spells, etc.)
├── utils/            # Utility functions
├── styles/           # Styled components and D&D themes
├── App.tsx           # Main app component with routing
└── index.tsx         # Application entry point

public/
├── manifest.json     # PWA manifest for app-like experience
├── sw.js            # Service worker for offline support
└── icons/           # D&D-themed app icons
```

## 🛠️ Available Scripts

- `npm start` - Start development server
- `npm run build` - Build production bundle
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run analyze` - Bundle size analysis

## 🎨 UI Components & Design System

### D&D 2024 Theme Integration

Built with styled-components and D&D-themed design system:

```typescript
// D&D 2024 Theme Configuration
const theme = {
  colors: {
    primary: '#8B0000', // Classic D&D red
    secondary: '#DAA520', // Gold accents
    background: '#1a1a1a', // Dark parchment
    surface: '#2d2d2d', // Card surfaces
    text: '#ffffff', // Primary text
    textSecondary: '#cccccc', // Secondary text
    success: '#228B22', // Success states
    warning: '#FF8C00', // Warning states
    error: '#DC143C', // Error states
  },
  typography: {
    heading: '"Cinzel", serif', // Fantasy-style headers
    body: '"Inter", sans-serif', // Readable body text
    monospace: '"Fira Code", monospace', // Stats/numbers
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px',
  },
};
```

### Planned Component Library

#### Character Management

- **CharacterSheet**: Main character interface with D&D 2024 layout
- **CharacterCreator**: Step-by-step character creation wizard
- **AbilityScores**: D&D 2024 ability score management
- **SkillsPanel**: Proficiencies and skill bonuses

#### D&D Content Integration

- **SpellBrowser**: Search and display 391 spells with filtering
- **ItemBrowser**: Browse 705 items with rarity and type filters
- **FeatSelector**: Choose from 77 feats with prerequisite checking
- **ClassFeatures**: Display class abilities and subclass options

#### Mobile & Tablet Optimization

- **ResponsiveLayout**: Adaptive layout for different screen sizes
- **TouchOptimized**: Touch-friendly dice rolling and interaction
- **OfflineSupport**: PWA features for gameplay without internet

Main character display and editing interface.

```typescript
interface CharacterSheetProps {
  character: Character;
  isEditing: boolean;
  onUpdate: (updates: Partial<Character>) => void;
}
```

#### DiceRoller

Interactive dice rolling component with animation.

```typescript
interface DiceRollerProps {
  dice: string; // e.g., "1d20+5"
  onRoll: (result: DiceResult) => void;
  disabled?: boolean;
}
```

#### SpellList

Filterable spell browser with search and favorites.

```typescript
interface SpellListProps {
  spells: Spell[];
  selectedSpells: number[];
  onSpellSelect: (spellId: number) => void;
  filters: SpellFilters;
}
```

## 📱 Progressive Web App

### PWA Features

- **Offline Support**: Service worker caches character data
- **Install Prompt**: Add to home screen functionality
- **Push Notifications**: Campaign updates and reminders
- **Background Sync**: Sync changes when online

### Manifest Configuration

```json
{
  "name": "D&D Character Sheet Generator",
  "short_name": "D&D Sheets",
  "display": "standalone",
  "theme_color": "#8B0000",
  "background_color": "#1a1a1a",
  "start_url": "/",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 📱 Mobile Responsiveness

### Breakpoints

```typescript
const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px',
};

// Usage in styled-components
const Container = styled.div`
  padding: 16px;

  @media (min-width: ${breakpoints.tablet}) {
    padding: 24px;
  }
`;
```

### Touch-Friendly Interface

- Large tap targets (minimum 44px)
- Swipe gestures for navigation
- Optimized forms for mobile keyboards
- Tablet-specific layouts for character sheets

## 🔌 API Integration

### HTTP Client

Using Axios with interceptors for API communication:

```typescript
// API service setup
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
});

// Auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### React Query Integration

Efficient server state management:

```typescript
// Character queries
export const useCharacters = () => {
  return useQuery(['characters'], fetchCharacters, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCharacterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(updateCharacter, {
    onSuccess: () => {
      queryClient.invalidateQueries(['characters']);
    },
  });
};
```

### WebSocket Connection

Real-time updates with Socket.io:

```typescript
const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL);
    setSocket(socketInstance);

    return () => socketInstance.close();
  }, []);

  return socket;
};
```

## 🎯 State Management

### Zustand Store

Lightweight state management:

```typescript
interface CharacterStore {
  characters: Character[];
  currentCharacter: Character | null;
  isLoading: boolean;
  setCharacters: (characters: Character[]) => void;
  setCurrentCharacter: (character: Character) => void;
  updateCharacter: (id: number, updates: Partial<Character>) => void;
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],
  currentCharacter: null,
  isLoading: false,

  setCharacters: (characters) => set({ characters }),
  setCurrentCharacter: (character) => set({ currentCharacter: character }),

  updateCharacter: (id, updates) =>
    set((state) => ({
      characters: state.characters.map((char) =>
        char.id === id ? { ...char, ...updates } : char
      ),
      currentCharacter:
        state.currentCharacter?.id === id
          ? { ...state.currentCharacter, ...updates }
          : state.currentCharacter,
    })),
}));
```

## 🎨 Styling and Theming

### Styled Components

Component-scoped CSS with theme support:

```typescript
const CharacterCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;
```

### Animation with Framer Motion

```typescript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

const CharacterList = () => (
  <AnimatePresence>
    {characters.map((character) => (
      <motion.div key={character.id} {...fadeInUp}>
        <CharacterCard character={character} />
      </motion.div>
    ))}
  </AnimatePresence>
);
```

## 🧪 Testing

### Jest and React Testing Library

```typescript
// Component test example
describe('CharacterCard', () => {
  const mockCharacter = {
    id: 1,
    name: 'Test Character',
    level: 5,
    // ... other properties
  };

  test('renders character information', () => {
    render(<CharacterCard character={mockCharacter} />);

    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  test('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn();
    render(<CharacterCard character={mockCharacter} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockCharacter.id);
  });
});
```

### Custom Hooks Testing

```typescript
// Hook test example
describe('useCharacter', () => {
  test('fetches character data', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCharacter(1), {
      wrapper: QueryWrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.character).toBeDefined();
  });
});
```

## ♿ Accessibility

### WCAG 2.1 AA Compliance

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Color contrast compliance
- Screen reader support

```typescript
// Accessible form example
const AccessibleInput = styled.input`
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const FormField = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id}>{label}</label>
    <AccessibleInput id={id} aria-describedby={`${id}-help`} {...props} />
    <div id={`${id}-help`} className="sr-only">
      {props['aria-description']}
    </div>
  </div>
);
```

## 📊 Performance Optimization

### Code Splitting

```typescript
// Lazy loading components
const CharacterSheet = lazy(() => import('./components/CharacterSheet'));
const SpellBook = lazy(() => import('./components/SpellBook'));

const App = () => (
  <Router>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/character/:id" element={<CharacterSheet />} />
        <Route path="/spells" element={<SpellBook />} />
      </Routes>
    </Suspense>
  </Router>
);
```

### Memoization

```typescript
// Expensive calculations
const CharacterStats = memo(({ character }) => {
  const calculatedStats = useMemo(
    () => calculateDerivedStats(character),
    [character.abilityScores, character.level, character.proficiencies]
  );

  return <StatsDisplay stats={calculatedStats} />;
});
```

### Bundle Optimization

- Tree shaking for unused code
- Dynamic imports for heavy libraries
- Image optimization and lazy loading
- Service worker caching strategies

## 🔧 Build Configuration

### Environment Variables

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001

# Feature Flags
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_DEBUG=true

# Build Configuration
GENERATE_SOURCEMAP=true
INLINE_RUNTIME_CHUNK=false
```

### Custom Webpack Config

Using CRACO for build customization:

```javascript
// craco.config.js
module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    {
      plugin: require('craco-alias'),
      options: {
        source: 'tsconfig',
        baseUrl: './src',
        tsConfigPath: './tsconfig.paths.json',
      },
    },
  ],
};
```

## 🚨 Error Handling

### Error Boundaries

```typescript
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback onRetry={() => this.setState({ hasError: false })} />
      );
    }

    return this.props.children;
  }
}
```

## 🤝 Contributing

1. Follow React best practices and hooks patterns
2. Use TypeScript for all components and utilities
3. Write comprehensive tests
4. Ensure accessibility compliance
5. Maintain consistent code style with Prettier/ESLint

### Component Development Guidelines

- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow naming conventions (PascalCase for components)
- Include comprehensive prop documentation
- Write unit tests for all components

```typescript
// Example component template
interface MyComponentProps {
  /** Component title */
  title: string;
  /** Optional description */
  description?: string;
  /** Click handler */
  onClick: () => void;
}

/**
 * MyComponent - Brief description of the component
 *
 * @param props - Component props
 * @returns JSX element
 */
export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  description,
  onClick,
}) => {
  return (
    <div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      <button onClick={onClick}>Click me</button>
    </div>
  );
};
```
