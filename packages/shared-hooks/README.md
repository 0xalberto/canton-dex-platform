# @cantondex/shared-hooks

Shared React hooks library for CantonDEX applications.

## Installation

```bash
pnpm add @cantondex/shared-hooks
```

## Hooks

### useAPI

Hook for making API calls with loading, error, and data state management.

```tsx
import { useAPI } from '@cantondex/shared-hooks';

function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error, execute, reset } = useAPI(
    async (id: string) => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    {
      onSuccess: (data) => console.log('User loaded:', data),
      onError: (error) => console.error('Error:', error)
    }
  );

  useEffect(() => {
    execute(userId);
  }, [userId, execute]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <div>{data.name}</div>;
}
```

**API:**
- `data` - The response data (null if no data)
- `loading` - Loading state
- `error` - Error object (null if no error)
- `execute(...args)` - Function to execute the API call
- `reset()` - Reset state to initial values

### useAuth

Hook for managing authentication state.

```tsx
import { useAuth } from '@cantondex/shared-hooks';

function App() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth({
    loginFn: async (credentials) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return response.json();
    },
    logoutFn: async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
    },
    getUserFn: async () => {
      const response = await fetch('/api/auth/me');
      return response.json();
    }
  });

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

**API:**
- `user` - Current user object (null if not authenticated)
- `isAuthenticated` - Authentication status
- `isLoading` - Loading state during initialization
- `login(credentials)` - Login function
- `logout()` - Logout function
- `updateUser(user)` - Update user data

### useLocalStorage

Hook for managing localStorage with React state synchronization.

```tsx
import { useLocalStorage } from '@cantondex/shared-hooks';

function Settings() {
  const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={removeTheme}>Reset</button>
    </div>
  );
}
```

**Features:**
- Automatic synchronization across tabs/windows
- Type-safe with TypeScript
- SSR-safe (won't crash during server-side rendering)

**API:**
- `[0]` - Current value
- `[1]` - Set value function (pass null to remove)
- `[2]` - Remove value function

### usePagination

Hook for managing pagination state and calculations.

```tsx
import { usePagination } from '@cantondex/shared-hooks';

function DataTable({ data }: { data: any[] }) {
  const {
    currentPage,
    pageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    paginateData,
    setTotalItems,
    setPageSize
  } = usePagination({
    initialPage: 1,
    initialPageSize: 10
  });

  useEffect(() => {
    setTotalItems(data.length);
  }, [data.length, setTotalItems]);

  const paginatedData = paginateData(data);

  return (
    <div>
      <table>
        {paginatedData.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
          </tr>
        ))}
      </table>

      <div>
        <button onClick={previousPage} disabled={!hasPreviousPage}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={nextPage} disabled={!hasNextPage}>
          Next
        </button>
      </div>
    </div>
  );
}
```

**API:**
- `currentPage` - Current page number (1-indexed)
- `pageSize` - Items per page
- `totalPages` - Total number of pages
- `totalItems` - Total number of items
- `startIndex` - Start index for current page
- `endIndex` - End index for current page
- `hasNextPage` - Whether next page exists
- `hasPreviousPage` - Whether previous page exists
- `setPage(page)` - Set current page
- `setPageSize(size)` - Set page size (resets to page 1)
- `setTotalItems(total)` - Set total items count
- `nextPage()` - Go to next page
- `previousPage()` - Go to previous page
- `goToFirstPage()` - Go to first page
- `goToLastPage()` - Go to last page
- `paginateData(data)` - Paginate an array of data

### useTheme

Hook for managing theme (light/dark mode).

```tsx
import { useTheme } from '@cantondex/shared-hooks';

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme} (resolved: {resolvedTheme})</p>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

**Features:**
- Supports light, dark, and system themes
- Automatically applies theme to document
- Persists theme preference in localStorage
- Listens to system theme changes when using 'system'

**API:**
- `theme` - Current theme setting ('light' | 'dark' | 'system')
- `setTheme(theme)` - Set theme
- `resolvedTheme` - Actual theme being displayed ('light' | 'dark')

### useDebounce

Hook for debouncing values and callbacks.

**Debounce a value:**

```tsx
import { useDebounce } from '@cantondex/shared-hooks';

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // API call will only happen 500ms after user stops typing
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

**Debounce a callback:**

```tsx
import { useDebouncedCallback } from '@cantondex/shared-hooks';

function SearchInput() {
  const debouncedSearch = useDebouncedCallback(
    (term: string) => {
      searchAPI(term);
    },
    500
  );

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

**API:**
- `useDebounce(value, delay)` - Returns debounced value
- `useDebouncedCallback(callback, delay)` - Returns debounced callback function

## Development

```bash
# Install dependencies
pnpm install

# Build the library
pnpm build

# Watch mode for development
pnpm dev

# Type check
pnpm type-check

# Lint
pnpm lint
```

## License

MIT
