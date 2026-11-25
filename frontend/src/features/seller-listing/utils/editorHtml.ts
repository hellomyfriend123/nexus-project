// Compatibility exports for the listing editor; parsing rules are shared with product detail.
export {
  sanitizeRichTextHtml as sanitizeEditorHtml,
  serializeRichTextHtml as serializeEditorHtml,
  textToRichTextHtml as textToEditorHtml,
} from '../../../shared/utils/richTextHtml';
