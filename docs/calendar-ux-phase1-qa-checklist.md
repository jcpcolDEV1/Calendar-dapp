# Calendar UX Phase 1 – Manual QA Checklist

**Target:** ~10 minutes | **Date:** _____________

---

## 1. Day Panel Behavior
- [ ] Click a day → panel slides in from right with backdrop
- [ ] Header shows correct date (e.g. "Wednesday, March 11, 2025")
- [ ] Close via X button works
- [ ] Close via Escape key works

## 2. Quick Task Creation
- [ ] Type task + Enter → task appears in list
- [ ] Input clears after successful creation
- [ ] Toast shows on success/error
- [ ] Input disabled while creating (no double-submit)

## 3. Time Parsing
- [ ] `9:00 reunión` → task at 09:00
- [ ] `2:30pm meeting` → task at 14:30
- [ ] `9am lunch` → task at 09:00
- [ ] `comprar comida` (no time) → task without time

## 4. Inline Editing
- [ ] Click task title → input appears, focused
- [ ] Enter or blur → saves changes
- [ ] Escape → cancels, restores original
- [ ] Empty/unchanged → no update

## 5. Task Ordering
- [ ] Timed tasks appear first, sorted by time (earliest first)
- [ ] Untimed tasks appear after timed ones
- [ ] Order persists after refresh

## 6. Calendar Day Preview
- [ ] Up to 3 tasks shown per day cell
- [ ] Timed: `09:00 reunión` format
- [ ] Untimed: `• comprar comida` format
- [ ] "+N more" when >3 tasks
- [ ] Hover shows full title (tooltip)

## 7. Today / Current Week Highlight
- [ ] Today cell has blue background and blue date badge
- [ ] Other days in current week have subtle blue tint
- [ ] Other months have muted/gray styling

---

## Notes
_____________________________________________________________
_____________________________________________________________
