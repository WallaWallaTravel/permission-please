# Permission Please 📝

> A modern, digital solution for school permission slips and signature collection

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)

## 🎯 Problem Statement

Teachers spend countless hours creating, distributing, collecting, and tracking paper permission slips for field trips, sports events, and school activities. Parents often miss deadlines, lose forms, or struggle to return them on time. In 2025, this process should be digital, automated, and seamless.

**Permission Please** solves this by providing a modern web application that:

- ✅ Allows teachers to create and send digital permission forms in minutes
- ✅ Enables parents to sign forms from any device, anywhere
- ✅ Automatically tracks who has and hasn't signed
- ✅ Sends automated reminders before deadlines
- ✅ Maintains secure records with audit trails

## ✨ Key Features

### For Teachers

- 📋 **Easy Form Creation** - Create permission forms with drag-and-drop simplicity
- 📊 **Real-time Tracking** - See who's signed and who hasn't at a glance
- 📧 **Automated Emails** - Send forms and reminders automatically
- 📱 **Mobile Friendly** - Manage everything from your phone
- 📁 **Template Library** - Reuse forms from previous years
- 📈 **Analytics** - Track completion rates and response times

### For Parents

- 🔗 **One-Click Access** - Open forms directly from email (no login required)
- ✍️ **Digital Signatures** - Sign with finger on phone or mouse on computer
- ⚡ **Fast Submission** - Complete forms in under 2 minutes
- 📱 **Mobile Optimized** - Perfect experience on any device
- 📝 **Form History** - Access all signed forms in parent portal

### For Everyone

- 🔒 **Secure** - Enterprise-grade security and encryption
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 🌍 **Reliable** - 99.9% uptime with managed infrastructure
- 🎨 **Beautiful UI** - Modern, intuitive interface

## 🚀 Tech Stack

### Frontend

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation

### Backend

- **Runtime**: Next.js API Routes (Serverless)
- **Database**: PostgreSQL via [Railway](https://railway.app)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Email**: [Resend](https://resend.com/)

### Testing & Quality

- **Unit Tests**: [Vitest](https://vitest.dev/) + React Testing Library
- **E2E Tests**: [Playwright](https://playwright.dev/)
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript strict mode

### Infrastructure

- **Database Hosting**: [Railway](https://railway.app)
- **App Hosting**: [Vercel](https://vercel.com/) or Railway
- **Monitoring**: [Sentry](https://sentry.io/)
- **Analytics**: Vercel Analytics

## 📚 Documentation

- **[Project Plan](./PROJECT_PLAN.md)** - Complete feature roadmap and development timeline
- **[Architecture](./ARCHITECTURE.md)** - System design, data flow, and technical decisions
- **[Setup Guide](./SETUP_GUIDE.md)** - Step-by-step development environment setup
- **[Testing Patterns](./TESTING_PATTERNS.md)** - Testing examples and best practices

## 🏁 Quick Start

```bash
# 1. Clone and setup
cd /Users/temp/permission-please
npm install

# 2. Set up Railway database (see RAILWAY_SETUP.md)
#    - Sign up at railway.app
#    - Create PostgreSQL database
#    - Copy connection URL to .env

# 3. Push schema and seed data
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev

# 5. Open in browser
open http://localhost:3000

# Login with: teacher@test.com / password123
```

For detailed setup instructions, see [RAILWAY_SETUP.md](./RAILWAY_SETUP.md).

## 🧪 Development Workflow

This project follows Test-Driven Development (TDD) and includes comprehensive CI/CD:

```bash
# Development with testing
npm run dev          # Start dev server
npm run test         # Run tests in watch mode
npm run db:studio    # Open database GUI

# Before committing (automated via Husky)
npm run type-check   # TypeScript validation
npm run lint         # ESLint
npm run test         # All tests
npm run format       # Prettier

# E2E testing
npm run test:e2e     # Run Playwright tests
npm run test:e2e:ui  # Interactive test UI

# Production
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality Gates

Every commit automatically runs:

- ✅ TypeScript type checking
- ✅ ESLint (with auto-fix)
- ✅ Prettier formatting
- ✅ Unit tests for changed files

Every PR automatically runs:

- ✅ All tests (unit + integration + E2E)
- ✅ Coverage check (80% minimum)
- ✅ Build verification
- ✅ Lighthouse performance audit
- ✅ Security audit

## 📊 Project Status

### Phase 1: MVP (Weeks 1-4)

- [ ] Project setup and configuration
- [ ] Authentication system
- [ ] Form creation interface
- [ ] Digital signature component
- [ ] Email notifications
- [ ] Parent signing flow
- [ ] Basic dashboard

### Phase 2: Enhanced Features (Weeks 5-6)

- [ ] Form templates
- [ ] Automated reminders
- [ ] Analytics dashboard
- [ ] PDF generation
- [ ] Performance optimization
- [ ] Accessibility audit

### Phase 3: Polish & Launch (Weeks 7-8)

- [ ] Mobile optimization
- [ ] Cross-browser testing
- [ ] Security audit
- [ ] Beta testing with teachers
- [ ] Documentation
- [ ] Production deployment

## 🔒 Security

Security is a top priority for an application handling student data:

- 🔐 **Authentication**: Secure password hashing, JWT tokens
- 🛡️ **Authorization**: Role-based access control (RBAC)
- 🔒 **Data Encryption**: HTTPS only, encrypted at rest
- 🔍 **Input Validation**: Zod schema validation on all inputs
- 🚫 **CSRF Protection**: Built-in Next.js protection
- 📝 **Audit Logging**: All signature events logged with timestamps and IP
- 🎯 **Rate Limiting**: Prevent brute force and DoS attacks
- 👁️ **Monitoring**: Real-time error and security event tracking

## ♿ Accessibility

Committed to WCAG 2.1 AA compliance:

- ⌨️ Full keyboard navigation
- 🎯 Semantic HTML
- 🔊 Screen reader support
- 🎨 Sufficient color contrast
- 📱 Responsive and mobile-friendly
- 🧪 Automated accessibility testing (axe)

## 🌟 Why This Tech Stack?

### Next.js 14

- **Server Components**: Faster page loads, reduced JavaScript
- **App Router**: Modern, file-based routing
- **API Routes**: Full-stack in one codebase
- **Optimizations**: Built-in image, font, and script optimization
- **Vercel Integration**: Deploy in seconds with zero config

### TypeScript

- **Type Safety**: Catch errors before runtime
- **Better DX**: Autocomplete and inline documentation
- **Refactoring**: Confident large-scale changes
- **Team Collaboration**: Self-documenting code

### Prisma

- **Type-Safe**: Auto-generated TypeScript types
- **Migrations**: Version-controlled schema changes
- **Studio**: Visual database browser
- **Performance**: Optimized queries out of the box

### Tailwind CSS

- **Rapid Development**: Style directly in JSX
- **Consistency**: Design system built-in
- **Performance**: Purged CSS, minimal bundle
- **Responsive**: Mobile-first utilities

### React Query

- **Server State**: Handles caching, refetching, synchronization
- **Optimistic Updates**: Instant UI feedback
- **DevTools**: Debug data flow easily
- **Error Handling**: Automatic retry and error boundaries

## 📈 Performance Targets

- ⚡ **First Contentful Paint**: < 1.8s
- 🎯 **Time to Interactive**: < 3s
- 📦 **Bundle Size**: < 200KB (gzipped)
- 🏃 **Lighthouse Score**: > 90
- 📱 **Mobile Experience**: Near-native feel

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Implement your feature
5. Ensure all tests pass (`npm run test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Product Owner**: [Your Name]
- **Lead Developer**: [Your Name]
- **Beta Testers**: [School Name] Teachers

## 🙏 Acknowledgments

- Teachers who provided feedback on the paper permission process
- Parents who participated in user testing
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Next.js](https://nextjs.org/) team for an amazing framework

## 📞 Support

- 📧 Email: support@permissionplease.app
- 📖 Documentation: [docs.permissionplease.app](https://docs.permissionplease.app)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/yourusername/permission-please/issues)

---

**Built with ❤️ for teachers, parents, and students**

Making permission slips simple, one signature at a time.
