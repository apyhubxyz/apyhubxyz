# Apyhub Frontend

A modern DeFi yield aggregator platform built with Next.js 14, TypeScript, and Tailwind CSS.

## Overview

Apyhub (apyhub.xyz) is a decentralized APY aggregator that helps users discover the best yield opportunities across multiple DeFi protocols. The frontend provides a clean, responsive interface with real-time data visualization.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** React Icons

## Features

-  Real-time APY tracking across protocols
-  Interactive data visualization
-  Modern UI with glassmorphism effects
-  Fully responsive design
-  Dark mode support (system preference)
-  Optimized performance with lazy loading
-  Smooth animations and transitions

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Homepage
│   └── globals.css      # Global styles
├── components/
│   ├── Header.tsx       # Navigation header
│   ├── Hero.tsx         # Hero section
│   ├── Features.tsx     # Features grid
│   ├── APYShowcase.tsx  # Protocol APY display
│   ├── Benefits.tsx     # Platform benefits
│   ├── CTA.tsx          # Call-to-action section
│   └── Footer.tsx       # Footer with links
├── public/              # Static assets
└── package.json         # Dependencies
```

## Design System

### Colors

- **Primary (Brown):** Various shades from `brown-50` to `brown-950`
- **Secondary (Purple):** Various shades from `purple-50` to `purple-950`
- **Accent:** Gradient combinations of brown and purple

### Typography

- **Headings:** Poppins font
- **Body:** Inter font

## Development Notes

### Component Guidelines

- All components use client-side rendering (`'use client'`)
- Motion animations are implemented with Framer Motion
- Components follow a consistent structure with TypeScript

### Performance Considerations

- Images are optimized with Next.js Image component
- Lazy loading for below-the-fold content
- CSS animations use GPU acceleration where possible

### Known Issues

- [ ] Mobile menu animation could be smoother
- [ ] Need to implement actual Web3 wallet connection
- [ ] APY data currently using mock data
- [ ] Newsletter subscription not connected to backend

## API Integration

The frontend is designed to connect with the Apyhub backend API. Currently using mock data for development.

### Endpoints (To be implemented)

- `GET /api/protocols` - Fetch supported protocols
- `GET /api/apy/:protocol` - Get APY rates for specific protocol
- `GET /api/stats` - Platform statistics
- `POST /api/subscribe` - Newsletter subscription

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://api.apyhub.xyz
NEXT_PUBLIC_WS_URL=wss://ws.apyhub.xyz
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

- Website(Soon): [apyhub.xyz](https://apyhub.xyz)

---

Built with ❤️ by the Apyhub team