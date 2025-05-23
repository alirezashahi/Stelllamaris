# Stellamaris - Sustainable Luxury Bags E-commerce Platform

> **Crafting sustainable luxury bags that make a difference.**  
> 5% of our profits support animal shelters and charities worldwide.

## 🌟 Project Overview

Stellamaris is a modern e-commerce platform specializing in sustainable luxury handbags. Built with a mission to combine style with environmental responsibility, every purchase supports animal welfare and charitable causes.

### Key Features

- 🌱 **Sustainability Focus**: Eco-friendly materials and ethical sourcing
- ❤️ **Charity Integration**: 5% of profits donated to user-selected charities
- 🛍️ **Premium Shopping Experience**: Luxury e-commerce with modern design
- 📱 **Mobile-First**: Responsive design for all devices
- ⚡ **Performance Optimized**: Fast loading and smooth interactions

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Convex (Serverless Backend)
- **Styling**: Tailwind CSS + Custom Brand Design
- **UI Components**: Radix UI + Lucide Icons
- **Authentication**: Clerk (planned)
- **Payments**: Stripe (planned)
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stellamaris-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Convex backend**
   ```bash
   npx convex dev
   ```
   Follow the prompts to create a new Convex project.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
stellamaris-ecommerce/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   └── pages/
│   │       └── Homepage.tsx
│   ├── styles/
│   │   └── index.css
│   ├── App.tsx
│   └── main.tsx
├── convex/
│   ├── schema.ts          # Database schema
│   ├── products.ts        # Product queries
│   └── _generated/        # Convex generated files
├── public/
├── package.json
└── README.md
```

## 🗄️ Database Schema

Our Convex database includes comprehensive tables for:

- **Users & Authentication**: User accounts with charity preferences
- **Products & Catalog**: Products, categories, images, variants
- **E-commerce**: Shopping cart, orders, payments
- **Reviews & Social**: Product reviews and ratings
- **Charity & Sustainability**: Donation tracking and impact metrics
- **Marketing**: Newsletter, promo codes, analytics

## 🎨 Brand Identity

### Color Palette

- **Stellamaris Orange**: Primary brand color (#f27c0b)
- **Sage Green**: Secondary sustainability color (#5a6b5a)
- **Supporting Colors**: Warm earth tones and neutrals

### Design Principles

- **Luxury & Elegance**: Premium feel with refined typography
- **Sustainability**: Earth-inspired colors and eco-messaging
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile-First**: Responsive design for all devices

## 🌱 Sustainability Mission

### Our Commitment

- **5% Profit Donation**: Automatically donated to user-selected charities
- **Sustainable Materials**: Ethically sourced, eco-friendly materials
- **Transparent Impact**: Track and report environmental and social impact
- **Charity Partners**: Animal shelters, environmental, children, and education causes

### Impact Tracking

The platform includes built-in features to:
- Track total donations made
- Show individual user impact
- Display charity organization information
- Generate impact reports

## 🚧 Development Status

### ✅ Completed (Phase 1: Foundation)

- [x] Project setup and configuration
- [x] Convex backend with comprehensive database schema
- [x] Brand identity and visual design system
- [x] Homepage with hero section and product displays
- [x] Header and footer components
- [x] Responsive layout and styling

### 🔄 In Progress (Phase 2: Core Features)

- [ ] User authentication and accounts
- [ ] Product listing and detail pages
- [ ] Shopping cart functionality
- [ ] Sample product data

### 📋 Planned (Phase 3+)

- [ ] Checkout and payment processing
- [ ] Admin panel for product management
- [ ] Charity integration and impact tracking
- [ ] Reviews and ratings system
- [ ] Order management and tracking

## 🤝 Contributing

We welcome contributions! Please see our development checklist for current priorities:

1. Review `DEVELOPMENT_CHECKLIST.md` for current tasks
2. Check existing issues and create new ones for bugs/features
3. Follow our coding standards and commit conventions
4. Submit pull requests with clear descriptions

## 📝 Environment Variables

Create a `.env.local` file with:

```env
VITE_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOYMENT=your_convex_deployment_name
```

These are automatically generated when you run `npx convex dev`.

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Convex Deployment

```bash
npx convex deploy
```

## 📞 Support

- **Email**: hello@stellamaris.com
- **Documentation**: [Convex Docs](https://docs.convex.dev)
- **Issues**: Use GitHub Issues for bug reports and feature requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Made with ❤️ for a sustainable future** 