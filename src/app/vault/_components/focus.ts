/** Ref callback that moves focus to the element when it mounts, so the new link is announced. */
export const focusOnMount = (element: HTMLElement | null): void => {
  element?.focus();
};
