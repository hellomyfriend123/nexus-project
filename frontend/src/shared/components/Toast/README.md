# Stacking toasts

React adaptation of [Lucian #070: Stacking toasts](https://lucianlabs.dev/uxui-prompt/#070), MIT © 2026 Seokwoooo.

Mount one `ToastProvider` at the application root (already supplied through AppProviders). Nothing is displayed until a real event calls `notify`.

```tsx
import { notify } from '@/shared/components/Toast'; // or use the project's relative import

notify.success('Đã lưu thay đổi');
notify.error('Không thể lưu. Vui lòng thử lại.'); // stays until dismissed
notify.warning('Vui lòng kiểm tra thông tin');
notify.info('Có thông báo mới', {
  toastId: 'new-message', // repeated calls with this ID are deduplicated
  title: 'Tin nhắn',
  action: { label: 'Xem', onClick: () => openMessages() },
});

const id = notify.loading('Đang lưu…');
try {
  await saveChanges();
  notify.update(id, { render: 'Đã lưu', type: 'success' });
} catch {
  notify.update(id, { render: 'Lưu thất bại', type: 'error', autoClose: false });
}
notify.dismiss(id); // omit ID to dismiss every toast

// The loading toast changes only when this real task settles.
// The result is returned; rejection is rethrown, so callers must handle it.
await notify.promise(saveChanges, {
  pending: 'Đang lưu…',
  success: 'Đã lưu',
  error: 'Không thể lưu',
});
```

Options: `toastId`, `autoClose` (milliseconds or `false`), `role`, `title`, and `action`. `update` additionally accepts `render`, `type`, and `isLoading`. Success/info/warning use 4500 ms; error/loading persist. Only the front active toast counts down. Hover, keyboard focus, dragging and a hidden document pause its remaining time. Updating content/type/duration resets the countdown. `dismiss` begins a 450 ms exit before removal.

## Adaptations

- Fixed bottom-right, 350 px wide with viewport-safe mobile margins, no demo buttons or initial sample notifications.
- Original dimensions, shadows, colors, icon paths, spring timing, stacking and directional swipe motion retained. Local `--ux-*` tokens map to optional `--nx-*` light/dark tokens; explicit `data-theme` overrides system preference.
- Content intentionally wraps instead of truncating the original sample subtitle with an ellipsis, so real error messages remain readable. Expanded spacing uses measured card heights plus 8 px.
- Keyboard focus expands the stack and makes close/action controls reachable; tucked cards are inert. Reduced motion uses near-instant transitions but still reaches the entered/exit state.
- No simulated completion timer. Loading requires an explicit update or a settling task passed to `promise`.

## Validation

```sh
npm run typecheck
npm run build
node --test tests/toast-store.test.mjs tests/toast-ssr.test.mjs
```

Automated checks cover store identity/deduplication, subscription cleanup, lifecycle, actual promise completion/rejection and SSR without browser globals. Real browser checks remain necessary for light/dark appearance, 375 px layout, keyboard traversal, hover/swipe and reduced-motion behavior.
