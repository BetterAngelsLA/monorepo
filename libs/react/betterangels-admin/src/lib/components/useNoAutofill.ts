import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Keep password managers out of non-credential form controls.
 *
 * `Select` with `showSearch` renders a real `<input type="text" role="combobox">`, and
 * password managers heuristically classify it as a credential field — so a "Group by"
 * dropdown gets a save/fill badge.
 *
 * Part of this is antd's doing, and deliberate on their side:
 *
 *     autoComplete: autoComplete || 'new-password'
 *
 * (`@rc-component/select`, `SelectInput/Input`). That stops browser autofill covering the
 * option list, but "new-password" is precisely how a password manager is told a field is
 * a *new password*, so it reads as a credential.
 *
 * ## Why the vendor attributes and not just `autocomplete`
 *
 * `autocomplete="off"` is the standards-level fix and is applied here, but browsers are
 * permitted to ignore it for credential fields and managers do exactly that. 1Password
 * documents its own opt-out for this case — `data-1p-ignore` / `data-op-ignore` — which
 * exists precisely because the standard attribute is not enough:
 * https://www.1password.dev/web/compatible-website-design
 *
 * This is the appropriate place for the knowledge: one hook, applied to a container, so
 * any control inside it is covered and no individual field has to know about any
 * password manager. Adding it per field would be the thing to avoid — it puts vendor
 * trivia in every component and guarantees the next field someone adds is missed.
 *
 * Note the attributes are set on the rendered input rather than passed as props: antd's
 * `Select` does not accept or forward `autoComplete` (only the inner input does), so a
 * prop cannot reach the DOM.
 */
export function useNoAutofill(): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inputs = ref.current?.querySelectorAll('input');
    inputs?.forEach((input) => {
      input.setAttribute('autocomplete', 'off');
      // 1Password: skip this field entirely rather than offer to fill or save it.
      input.setAttribute('data-1p-ignore', 'true');
      // 1Password's legacy attribute name, and its Safari extension.
      input.setAttribute('data-op-ignore', 'true');
      // Bitwarden's equivalent, so the fix is not one vendor's private contract.
      input.setAttribute('data-bwignore', 'true');
    });
  }, []);

  return ref;
}
