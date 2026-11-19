import { useCallback, useEffect, useRef, useState } from 'react';
import { sanitizeRichTextHtml, serializeRichTextHtml, textToRichTextHtml } from '../../../shared/utils/richTextHtml';
import '../../../shared/styles/rich-text.css';
import { updateEditorPlaceholder } from '../utils/editorPlaceholder';

type FormatCommand = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList';
interface Props {
  id: string;
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  disabled?: boolean;
}
const tools: { command: FormatCommand; title: string; icon: string }[] = [
  { command: 'bold', title: 'In đậm (Ctrl+B)', icon: 'type-bold' },
  { command: 'italic', title: 'In nghiêng (Ctrl+I)', icon: 'type-italic' },
  { command: 'insertUnorderedList', title: 'Danh sách dấu chấm', icon: 'list-ul' },
  { command: 'insertOrderedList', title: 'Danh sách đánh số', icon: 'list-ol' },
];

export default function ListingDescriptionEditor({ id, value, onChange, placeholder, disabled = false }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const lastValue = useRef<string | null>(null);
  const composing = useRef(false);
  const [active, setActive] = useState<Partial<Record<FormatCommand, boolean>>>({});

  const rememberSelection = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
      setActive({});
      return;
    }
    selectionRef.current = range.cloneRange();
    setActive(Object.fromEntries(tools.map(tool => [tool.command, document.queryCommandState(tool.command)])));
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || composing.current || value === lastValue.current) return;
    editor.innerHTML = sanitizeRichTextHtml(value);
    lastValue.current = value;
    selectionRef.current = null;
    updateEditorPlaceholder(editor);
  }, [value]);

  useEffect(() => {
    document.addEventListener('selectionchange', rememberSelection);
    return () => document.removeEventListener('selectionchange', rememberSelection);
  }, [rememberSelection]);

  function syncValue() {
    const editor = editorRef.current;
    if (!editor) return;
    updateEditorPlaceholder(editor);
    if (composing.current) return;
    const html = serializeRichTextHtml(editor.innerHTML);
    lastValue.current = html;
    onChange(html);
    rememberSelection();
  }

  function restoreSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const saved = selectionRef.current;
    const range = saved && editor.contains(saved.startContainer) && editor.contains(saved.endContainer)
      ? saved : document.createRange();
    if (range !== saved) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function execute(command: FormatCommand | 'insertHTML', content?: string) {
    restoreSelection();
    // Native editing preserves the browser's selection and undo history without a new dependency.
    // execCommand is deprecated, but still supported by current Chrome/Edge/Firefox for contenteditable.
    document.execCommand(command, false, content);
    syncValue();
  }


  return (
    <div className="nx-listing-editor">
      <div className="nx-listing-toolbar" role="group" aria-label="Định dạng mô tả sản phẩm">
        {tools.map(tool => (
          <button
            key={tool.command}
            type="button"
            disabled={disabled}
            title={tool.title}
            aria-label={tool.title}
            aria-pressed={Boolean(active[tool.command])}
            onMouseDown={event => event.preventDefault()}
            onClick={() => execute(tool.command)}
          >
            <i className={`bi bi-${tool.icon}`} aria-hidden="true" />
          </button>
        ))}
        <span className="nx-listing-toolbar-note">Định dạng trực tiếp</span>
      </div>
      <div
        ref={editorRef}
        id={id}
        className="nx-listing-editor-content nx-rich-text"
        role="textbox"
        aria-label="Mô tả chi tiết sản phẩm"
        aria-multiline="true"
        aria-placeholder={placeholder}
        contentEditable={!disabled}
        aria-disabled={disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={syncValue}
        onCompositionStart={() => {
          composing.current = true;
          // Hide before the first composition input to prevent a placeholder/caret overlap.
          if (editorRef.current) editorRef.current.dataset.empty = 'false';
        }}
        onCompositionEnd={() => { composing.current = false; syncValue(); }}
        onBlur={rememberSelection}
        onKeyDown={event => {
          if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
          const key = event.key.toLowerCase();
          if (key === 'b' || key === 'i') {
            event.preventDefault();
            execute(key === 'b' ? 'bold' : 'italic');
          }
        }}
        onPaste={event => {
          event.preventDefault();
          rememberSelection();
          const html = event.clipboardData.getData('text/html');
          const text = event.clipboardData.getData('text/plain');
          const safe = html ? sanitizeRichTextHtml(html) : textToRichTextHtml(text);
          if (safe) execute('insertHTML', safe);
        }}
        onDragOver={event => event.preventDefault()}
        onDrop={event => event.preventDefault()}
      />
    </div>
  );
}
