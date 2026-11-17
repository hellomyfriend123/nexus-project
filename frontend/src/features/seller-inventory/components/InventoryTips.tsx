import { inventoryTips } from '../services/inventoryAdvice.mock';
export default function InventoryTips() {
  return <section className="nx-stock-tips" aria-label="Gợi ý dành cho nhà bán hàng">{inventoryTips.map(tip => <article className={`nx-stock-tip nx-stock-tone-${tip.tone}`} key={tip.title}><span className="nx-stock-tip-icon"><i className={`bi bi-${tip.icon}`} aria-hidden="true" /></span><div><h2>{tip.title}</h2><p>{tip.text}</p></div></article>)}</section>;
}
