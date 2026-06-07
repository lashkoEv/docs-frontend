const FLAG_FLIPPED_CLASS = 'flag-flipped';
const FLAG_BELOW_CLASS = 'flag-below';

export const positionCursorFlag = (
  flag: HTMLElement,
  caret: ClientRect,
  container: ClientRect,
): void => {
  flag.style.width = '';
  const flagRect = flag.getBoundingClientRect();

  flag.classList.toggle(FLAG_FLIPPED_CLASS, caret.left > container.width - flagRect.width);

  const showBelow = caret.top < flagRect.height;
  flag.classList.toggle(FLAG_BELOW_CLASS, showBelow);

  flag.style.left = `${caret.left}px`;
  flag.style.top = showBelow ? `${caret.top + caret.height}px` : `${caret.top}px`;
  flag.style.width = `${Math.ceil(flagRect.width)}px`;
};