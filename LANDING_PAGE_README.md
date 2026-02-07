# 🚀 Insight Tracker Landing Page

## ✨ Current Experience

### 1. **Navigation** (`components/Navigation.tsx`)
- ✅ Glass morphism top nav with active tab indicator
- ✅ Organization switcher for multi-tenant data
- ✅ Mobile responsive hamburger menu with animation
- ✅ Auth section with avatar + display name

### 2. **Landing Page** (`app/page.tsx`)
- ✅ Hero section with animated gradient background (Royal Purple → Primary Blue)
- ✅ Floating orbs with pulse animations
- ✅ Two CTAs: **Start Tracking** and **Create Account**
- ✅ Stats preview cards (live after sign-in)
- ✅ Feature highlights for attendance, analytics, and visitor tracking

### 3. **App Flow Highlights**
- ✅ Dashboard overview with recent services + last service date
- ✅ Add Attendance flow with visitor tracking + bulk import
- ✅ Analytics dashboard with charts + exports
- ✅ Settings page for organization + account updates

## 🎨 Design Notes

### Motion
- Hero content and CTAs animate in with staggered reveals
- Stats cards lift on hover
- Feature cards slide in on scroll

### Color & Style
- **Royal Purple**: #4b248c
- **Primary Blue**: #0047AB
- **Gold**: #F3CC3C
- **Background**: #f9f9f9

## 🔧 Configuration

### Environment Variables (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📦 Key Dependencies
- ✅ `firebase`
- ✅ `framer-motion`
- ✅ `lucide-react`
- ✅ `react-hot-toast`

## ✅ Status
- Landing page is updated for Insight Tracker branding
- Live metrics appear in the dashboard after sign-in
- UI is responsive across desktop + mobile

---

**Next**: We can continue refining the landing page visuals or expand the feature grid.
