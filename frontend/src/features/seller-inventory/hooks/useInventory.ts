import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSellerInventory, productImagesForUpdate, messageOf, sellerApi } from '../../../services/api/seller';
import type { InventoryProduct } from '../types/inventory';
import { notify } from '../../../shared/components/Toast';
type Editor = { kind:'product'|'stock'; row:InventoryProduct; name:string; description:string; price:string; operation:string; quantity:string };
export function useInventory() {
  const navigate = useNavigate();
  const [products,setProducts] = useState<InventoryProduct[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [reload,setReload] = useState(0);
  const [busy,setBusy] = useState(false);
  const [editor,setEditor] = useState<Editor|null>(null);
  const [editorError,setEditorError] = useState('');
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    loadSellerInventory(controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setProducts(data.inventories.map(row => {
        const product = data.products.get(row.productId)!;
        return { id:row.id, productId:product.id, description:product.description??'', images:product.images, primaryImageUrl:product.primaryImageUrl, name:product.name, sku:row.skuCode, category:product.categoryName, categoryId:product.categoryId, image:product.primaryImageUrl??product.images[0]??'', condition:'',conditionId:'',photoLabel:'',price:Number(product.basePrice),priceNote:product.status,stock:String(row.availableQuantity),sold:'',views:'',engagement:'',status:row.availableQuantity===0?'out':'listed',visible:product.status==='ACTIVE' };
      }));
    }).catch(error => { if (!controller.signal.aborted) setError(messageOf(error)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  },[reload]);
  const [tab,setTab] = useState('all');
  const [query,setQuery] = useState('');
  const [category,setCategory] = useState('all');
  const [sort,setSort] = useState('name');
  const [pageSize,setPageSize] = useState('10');
  const [page,setPage] = useState(1);
  useEffect(() => { setPage(1); },[tab,query,category,sort,pageSize]);
  const filteredRows = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('vi');
    const rows = products.filter(row => (tab==='all'||row.status===tab) && (category==='all'||row.categoryId===category) && (row.name+' '+row.sku).toLocaleLowerCase('vi').includes(search));
    if (sort==='price-desc') rows.sort((a,b)=>b.price-a.price);
    else if (sort==='price-asc') rows.sort((a,b)=>a.price-b.price);
    else if (sort==='stock') rows.sort((a,b)=>Number(a.stock)-Number(b.stock));
    else rows.sort((a,b)=>a.name.localeCompare(b.name,'vi'));
    return rows;
  },[products,tab,query,category,sort]);
  const totalRows = filteredRows.length;
  const totalPages = Math.max(1,Math.ceil(totalRows/Number(pageSize)));
  const currentPage = Math.min(page,totalPages);
  async function action(label:string,id?:string) {
    if (label==='Đăng bán sản phẩm mới') { navigate('/seller/products/new'); return; }
    const row = products.find(item=>item.id===id);
    if (!row?.productId || lock.current) return;
    if (label==='Xem sản phẩm') { navigate('/products/'+row.productId); return; }
    if (label==='Mở đấu giá') { navigate('/seller/auctions/new?productId='+encodeURIComponent(row.productId)); return; }
    if (label==='Chỉnh sửa'||label==='Điều chỉnh tồn kho') {
      setEditorError('');setEditor({kind:label==='Chỉnh sửa'?'product':'stock',row,name:row.name,description:row.description??'',price:String(row.price),operation:'INCREASE',quantity:''});return;
    }
    if (label==='Xóa sản phẩm' && window.confirm('Xóa sản phẩm “'+row.name+'”?')) {
      lock.current=true;setBusy(true);
      try { await sellerApi.deleteProduct(row.productId);setProducts(old=>old.filter(item=>item.productId!==row.productId));notify.success('Đã xóa sản phẩm.'); }
      catch (error) { notify.warning(messageOf(error)); }
      finally { lock.current=false;setBusy(false); }
    }
  }
  async function saveEditor() {
    if (!editor||lock.current) return;
    const price=Number(editor.price),quantity=Number(editor.quantity);
    if (editor.kind==='product' && (!editor.name.trim()||editor.name.length>200||editor.description.length>5000||!editor.price.trim()||!Number.isFinite(price)||price<=0||!Number.isSafeInteger(Math.round(price*100))||!/^\d+(\.\d{1,2})?$/.test(editor.price))) { setEditorError('Tên tối đa 200 ký tự, mô tả tối đa 5000 ký tự; giá bán lớn hơn 0 và tối đa 2 chữ số thập phân.');return; }
    if (editor.kind==='stock' && (!editor.quantity.trim()||!Number.isSafeInteger(quantity)||quantity<0||quantity>2147483647||(editor.operation!=='SET_AVAILABLE'&&quantity===0))) { setEditorError('Số lượng phải là số nguyên không vượt quá 2.147.483.647. Chỉ đặt tồn kho mới được dùng số 0.');return; }
    lock.current=true;setBusy(true);setEditorError('');
    try {
      if (editor.kind==='product') {
        const product=await sellerApi.updateProduct(editor.row.productId!,{name:editor.name.trim(),description:editor.description,basePrice:price,images:productImagesForUpdate(editor.row)});
        setProducts(old=>old.map(row=>row.productId===product.id?{...row,name:product.name,description:product.description??'',price:Number(product.basePrice)}:row));
      } else {
        const inventory=await sellerApi.updateInventory(editor.row.id,editor.operation,quantity);
        setProducts(old=>old.map(row=>row.id===inventory.id?{...row,stock:String(inventory.availableQuantity),status:inventory.availableQuantity===0?'out':'listed'}:row));
      }
      setEditor(null);notify.success(editor.kind==='product'?'Đã cập nhật sản phẩm.':'Đã cập nhật tồn kho.');
    } catch (error) { setEditorError(messageOf(error)); }
    finally { lock.current=false;setBusy(false); }
  }
  return { products,loading,error,busy,editor,setEditor,editorError,saveEditor,closeEditor:()=>{if(!lock.current)setEditor(null);},retry:()=>setReload(value=>value+1),tab,setTab,query,setQuery,category,setCategory,sort,setSort,pageSize,setPageSize,page:currentPage,setPage,totalRows,totalPages,rows:filteredRows.slice((currentPage-1)*Number(pageSize),currentPage*Number(pageSize)),action };
}
export type InventoryState = ReturnType<typeof useInventory>;
