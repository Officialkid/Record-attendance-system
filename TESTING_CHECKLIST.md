# AttendanceTracker Testing Checklist

Complete this checklist before launching the application to ensure all features work correctly.

---

## 🔐 AUTHENTICATION

- [ ] Sign-up creates user and organization
- [ ] Sign-in redirects to dashboard
- [ ] Logout works and redirects to landing
- [ ] Password reset sends email (if implemented)
- [ ] Protected routes redirect when not logged in
- [ ] Session persists on page refresh

---

## 🧭 NAVIGATION

- [ ] Sidebar links work (desktop)
- [ ] Bottom nav links work (mobile)
- [ ] Mobile drawer opens/closes correctly
- [ ] Active states update correctly
- [ ] Breadcrumbs show correct path
- [ ] Back button works as expected

---

## 📊 DASHBOARD PAGE

- [ ] Stats cards load correctly
- [ ] Quick actions navigate properly
- [ ] Recent activity table displays services
- [ ] Mini chart renders with data
- [ ] Empty states show when no data
- [ ] Loading skeletons appear while loading
- [ ] Greeting changes based on time of day

---

## ✏️ ADD ATTENDANCE PAGE

- [ ] Date picker works correctly
- [ ] Attendance counter increments/decrements
- [ ] Visitor section expands/collapses
- [ ] Multiple visitors can be added
- [ ] Form validation prevents invalid submissions
- [ ] Success message appears after save
- [ ] Data saves to correct organization
- [ ] Duplicate date check works
- [ ] Confetti animation plays on success
- [ ] Milestone toasts appear at 50, 100, 150, 200, 250, 300, 500, 1000

---

## 📈 ANALYTICS PAGE

- [ ] Filters work (month/year)
- [ ] Tabs switch correctly (Overview, Trends, Visitors, Reports)
- [ ] Charts render with data
- [ ] Stats cards show correct numbers
- [ ] Year-over-year comparison loads
- [ ] Empty states show when no data
- [ ] Data filtered by current organization
- [ ] Export button shows toast notification
- [ ] Print button works correctly

---

## ⚙️ SETTINGS PAGE

- [ ] Organization details load correctly
- [ ] Form can be edited
- [ ] Save button updates Firestore
- [ ] Cancel button resets form
- [ ] Success toast appears on save
- [ ] Tab navigation works
- [ ] Email displays correctly (read-only)
- [ ] Profile picture upload placeholder works
- [ ] Password change validation works

---

## 📱 RESPONSIVE DESIGN

- [ ] Desktop (>= 1024px): Sidebar visible
- [ ] Tablet (768-1024px): Layout adjusts
- [ ] Mobile (< 768px): Bottom nav + drawer
- [ ] All pages scroll correctly
- [ ] No horizontal scrollbar
- [ ] Touch targets minimum 44px
- [ ] Text readable at all sizes
- [ ] Cards stack properly on mobile
- [ ] Mobile drawer slides in smoothly
- [ ] Overlay closes drawer on click

---

## 🏢 MULTI-TENANCY

- [ ] Each org sees only their data
- [ ] Switching orgs updates data
- [ ] New org creation works
- [ ] Organization name displays correctly
- [ ] Data isolation enforced (test with 2 accounts)
- [ ] Organization ID properly filters all queries

---

## ⚡ PERFORMANCE

- [ ] Initial page load < 3 seconds
- [ ] Navigation feels instant
- [ ] Charts render smoothly
- [ ] No layout shift on load
- [ ] Images optimized
- [ ] No console errors
- [ ] No memory leaks (check dev tools)
- [ ] Animations run at 60fps
- [ ] Page transitions smooth (300ms)

---

## 🎨 VISUAL POLISH

- [ ] Colors match design (purple #4b248c, blue #0047AB, gold #F3CC3C)
- [ ] Spacing consistent throughout
- [ ] Typography hierarchy clear
- [ ] Icons render correctly
- [ ] Hover states work
- [ ] Focus states visible (accessibility)
- [ ] Animations smooth (60fps)
- [ ] Loading states everywhere
- [ ] Micro-animations enhance UX
- [ ] Button tap feedback (scale)
- [ ] StatCard hover lift effect

---

## 🔧 EDGE CASES

- [ ] Very long organization names (truncate)
- [ ] 0 services recorded (empty states)
- [ ] 1 service recorded (no trend comparison)
- [ ] 100+ services (pagination needed?)
- [ ] Large numbers (1000+ attendance) format correctly
- [ ] Slow internet (loading states appear)
- [ ] Network error (error messages show)
- [ ] Invalid dates rejected
- [ ] Maximum attendance enforced (1,000,000)
- [ ] Empty visitor names prevented

---

## 🌐 BROWSER COMPATIBILITY

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## ♿ ACCESSIBILITY

- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast passes WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Alt text on images
- [ ] Escape key closes modals/drawers
- [ ] Tab order logical

---

## 🔔 TOAST NOTIFICATIONS

- [ ] Success toasts appear (green)
- [ ] Error toasts appear (red)
- [ ] Loading toasts appear (blue)
- [ ] Toasts auto-dismiss after correct duration
- [ ] Toasts dismissible by clicking
- [ ] Multiple toasts stack vertically
- [ ] Toast position: top-right
- [ ] Milestone toasts use gradient background

---

## 🪲 BUG FIX PRIORITIES

### P0 (Critical - Fix Immediately)
- Authentication broken
- Data loss or corruption
- App crashes
- Security vulnerabilities

### P1 (High - Fix Before Launch)
- Feature doesn't work
- Wrong data displayed
- Mobile unusable
- Major visual bugs

### P2 (Medium - Fix Soon)
- Minor visual glitches
- Slow performance
- Missing polish
- Confusing UX

### P3 (Low - Fix Eventually)
- Nice-to-have features
- Minor inconsistencies
- Edge case bugs

---

## 🛠️ COMMON BUGS & FIXES

### Bug: Services not loading
**Fix:** Check `organizationId` is being passed correctly to Firestore queries

### Bug: Stats showing wrong numbers
**Fix:** Verify month/year filters are applying correctly

### Bug: Mobile nav overlapping content
**Fix:** Add `pb-20 lg:pb-8` to main content container

### Bug: Charts not rendering
**Fix:** Ensure Recharts is installed, check data format

### Bug: Organization switcher not updating
**Fix:** Verify localStorage and context state syncing

### Bug: Toast notifications not appearing
**Fix:** Check Toaster component is in root layout

### Bug: Animations janky
**Fix:** Use transform/opacity instead of width/height, check 60fps in dev tools

### Bug: Firebase permissions error
**Fix:** Verify Firestore security rules allow read/write for authenticated users

### Bug: Date picker not opening on mobile
**Fix:** Ensure react-datepicker mobile styles are loaded

### Bug: Confetti not playing
**Fix:** Check canvas-confetti is imported and called after successful save

---

## ✅ PRE-LAUNCH VERIFICATION

Before deploying to production:

1. **Run through entire user flow**
   - Sign up → Create org → Add attendance → View analytics → Adjust settings

2. **Test on real devices**
   - iPhone (Safari)
   - Android phone (Chrome)
   - iPad/tablet
   - Desktop (multiple browsers)

3. **Check Firebase Console**
   - Security rules active
   - Indexes created
   - Billing alerts set
   - Usage within limits

4. **Verify environment variables**
   - Production Firebase config
   - No console.logs in production
   - Error tracking configured

5. **Performance check**
   - Lighthouse score > 90
   - No console errors
   - Network requests optimized

6. **Final QA**
   - All tests above passed
   - No P0 or P1 bugs remaining
   - Documentation updated
   - Support email configured

---

## 🚀 READY FOR LAUNCH?

**All critical tests passed?** ✅  
**No P0/P1 bugs remaining?** ✅  
**Tested on multiple devices?** ✅  
**Firebase configured correctly?** ✅  
**Performance optimized?** ✅

**🎉 APP IS READY FOR PILOT LAUNCH! 🎉**

---

## 📝 POST-LAUNCH MONITORING

After launch, monitor:
- [ ] User sign-ups successful
- [ ] Error rates in Firebase
- [ ] Page load times
- [ ] User feedback/support tickets
- [ ] Database query performance
- [ ] Mobile vs desktop usage
- [ ] Most used features
- [ ] Drop-off points in user flow
