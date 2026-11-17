// Update the live DOM even during IME composition; publishing HTML can wait.
export function updateEditorPlaceholder(editor: Pick<HTMLElement, 'textContent' | 'dataset'>) {
  editor.dataset.empty = String(!editor.textContent?.replace(/[\s\u200b\u00a0]/g, ''));
}

