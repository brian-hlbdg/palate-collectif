# Palate Collectif v2.0

A luxury wine tasting experience platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🎨 Design System

### Color Palette

| Element | Dark Mode | Light Mode |
|---------|-----------|------------|
| Background | Off-black (#0A0A0A) | Warm white (#FAFAF9) |
| Surface/Cards | Soft black (#141414) | Pure white (#FFFFFF) |
| Primary text | Off-white (#F5F5F4) | Near-black (#171717) |
| Secondary text | Gray (#A8A29E) | Gray (#525252) |
| Wine accent | Muted mauve (#8B4557) | Deep wine (#722F37) |
| Gold accent | Bright gold (#FFD700) | Amber (#B8860B) |

### Typography

- **Font Family**: Manrope (Modern sans-serif)
- **Scale**: Fluid typography with clamp() for responsive sizing

### Components

All components are built with:
- CSS variables for theming
- Framer Motion for animations
- Full dark/light mode support
- Accessibility in mind (WCAG AA contrast)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/palate-collectif.git
cd palate-collectif
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (admin)/           # Admin dashboard routes
│   ├── (user)/            # User-facing routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
│
├── components/
│   ├── ui/                # Base UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── StarRating.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Loading.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── layout/            # Layout components
│   │   ├── Header.tsx
│   │   └── PageTransition.tsx
│   │
│   ├── providers/         # Context providers
│   │   ├── ThemeProvider.tsx
│   │   └── AuthProvider.tsx
│   │
│   ├── wine/              # Wine-specific components
│   └── forms/             # Form components
│
├── lib/
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Utility functions
│
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── styles/
    └── globals.css        # Global styles & CSS variables
```

## 🎯 Features

### User Features
- Join events with simple event codes
- Rate wines with animated star ratings
- Add personal notes and descriptors
- View tasting history
- Dark/light mode preference

### Admin Features
- Create and manage tasting events
- Add wines with detailed information
- View real-time analytics
- Export attendee data
- Booth mode for trade shows

## 🧩 Component Usage

### Button
```tsx
import { Button } from '@/components/ui'

<Button variant="primary" size="lg">
  Join Event
</Button>

<Button variant="gold" isLoading>
  Save Rating
</Button>
```

### StarRating
```tsx
import { StarRating } from '@/components/ui'

<StarRating
  value={rating}
  onChange={setRating}
  size="lg"
  showValue
/>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

<Card variant="elevated" interactive>
  <CardHeader>
    <CardTitle>Wine Name</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Toast Notifications
```tsx
import { useToast } from '@/components/ui'

const { addToast } = useToast()

addToast({
  type: 'success',
  message: 'Rating saved!',
})
```

## 🎨 Theming

The app uses CSS variables for theming. All color values automatically adapt to light/dark mode.

### Using Theme Colors in Components
```tsx
// In Tailwind classes
<div className="bg-[var(--surface)] text-[var(--foreground)]" />

// For wine accent
<span className="text-[var(--wine)]">Wine colored text</span>

// For gold highlights
<span className="text-[var(--gold)]">Gold accent</span>
```

### Theme Toggle
```tsx
import { ThemeToggle } from '@/components/ui'

// Simple toggle (dark/light)
<ThemeToggle />

// Full selector (light/dark/system)
<ThemeToggle variant="full" />
```

## 🔧 Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## 📱 Mobile Considerations

- Touch-friendly tap targets (min 44px)
- Safe area insets for notched devices
- Bottom sheet dialogs for mobile actions
- Reduced motion support
- Optimized for iPhone and Android

## ♿ Accessibility

- WCAG AA contrast ratios
- Focus visible indicators
- Screen reader support
- Reduced motion preference
- High contrast mode support

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production
```
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for wine enthusiasts everywhere.
