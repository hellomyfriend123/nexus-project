import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadSellerInventory, productImagesForUpdate, messageOf, sellerApi } from '../../../services/api/seller';
import type { InventoryProduct } from '../types/inventory';

import { notify } from '../../../shared/components/Toast';
export function useInventory() {
  const navigate = useNavigate();
  const [products,setProducts]=useState<InventoryProduct[]>([]);
  const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{const c=new AbortController();loadSellerInventory(c.signal).then(data=>setProducts(data.inventories.map(row=>{const p=data.products.get(row.productId)!;return {id:row.id,productId:p.id,description:p.description??'',images:p.images,primaryImageUrl:p.primaryImageUrl,name:p.name,sku:row.skuCode,category:p.categoryName,categoryId:p.categoryId,image:p.primaryImageUrl??p.images[0]??'',condition:'Chưa có dữ liệu',conditionId:'',photoLabel:'',price:Number(p.basePrice),priceNote:p.status,stock:String(row.availableQuantity),sold:'—',views:'—',engagement:'Chưa có API thống kê',status:row.availableQuantity===0?'out':'listed',visible:p.status==='ACTIVE'};}))).catch(e=>{if(!c.signal.aborted){setError(messageOf(e));notify.warning(messageOf(e));}}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[]);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [sort, setSort] = useState('updated');
  const [pageSize, setPageSize] = useState('10');const [page,setPage]=useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const action = async (label:string,_id?:string) => {if(label.includes('Đăng bán sản phẩm mới')){navigate('/seller/products/new');return;}const row=products.find(p=>p.id===_id);if(row?.productId){
 try{if(label==='Xem sản phẩm'){navigate('/products/'+row.productId);return;}
 if(label==='Chỉnh sửa'){const name=window.prompt('Tên sản phẩm:',row.name);if(name===null)return;const description=window.prompt('Mô tả:',row.description??'');if(description===null)return;const amount=window.prompt('Giá bán:',String(row.price));if(amount===null)return;const basePrice=Number(amount);if(!name.trim()||!Number.isFinite(basePrice)||basePrice<=0){notify.warning('Tên và giá bán không hợp lệ.');return;}const p=await sellerApi.updateProduct(row.productId,{name:name.trim(),description,basePrice,images:productImagesForUpdate(row)});setProducts(old=>old.map(v=>v.productId===p.id?{...v,name:p.name,description:p.description??'',price:Number(p.basePrice)}:v));notify.success('Đã cập nhật sản phẩm.');return;}
 if(label==='Xóa sản phẩm'){if(!window.confirm('Xóa sản phẩm này?'))return;await sellerApi.deleteProduct(row.productId);setProducts(old=>old.filter(p=>p.productId!==row.productId));notify.success('Đã xóa sản phẩm.');return;}
 if(label==='Nhập thêm'){const input=window.prompt('Số lượng nhập thêm:');if(input===null)return;const quantity=Number(input);if(!Number.isInteger(quantity)||quantity<=0){notify.warning('Nhập số nguyên dương.');return;}const inv=await sellerApi.updateInventory(row.id,'INCREASE',quantity);setProducts(old=>old.map(v=>v.id===row.id?{...v,stock:String(inv.availableQuantity),status:inv.availableQuantity?'listed':'out'}:v));notify.success('Đã cập nhật tồn kho.');return;}
 }catch(e){notify.warning(messageOf(e));return;}}
 notify.info(label+' — chưa có API hỗ trợ trong màn hình này.');};
  const rows = useMemo(() => {
    const text = query.trim().toLocaleLowerCase('vi');
    const filtered = products.filter(p => (tab === 'all' || p.status === tab) && (category === 'all' || p.categoryId === category) && (condition === 'all' || p.conditionId === condition) && `${p.name} ${p.sku} ${p.verified ?? ''}`.toLocaleLowerCase('vi').includes(text));
    if (sort === 'price-desc') filtered.sort((a,b) => b.price - a.price);
    if (sort === 'price-asc') filtered.sort((a,b) => a.price - b.price);
    if (sort === 'views') { const views = (s: string) => Number.parseFloat(s) * (s.includes('k') ? 1000 : 1) || 0; filtered.sort((a,b) => views(b.views) - views(a.views)); }
    if (sort === 'stock') filtered.sort((a,b) => (Number(a.stock.match(/\d+/)?.[0]) || 0) - (Number(b.stock.match(/\d+/)?.[0]) || 0));
    return filtered;
  }, [products, tab, query, category, condition, sort]);
  const totalRows=rows.length;const totalPages=Math.max(1,Math.ceil(totalRows/Number(pageSize)));const currentPage=Math.min(page,totalPages);const pagedRows=rows.slice((currentPage-1)*Number(pageSize),currentPage*Number(pageSize));
  function toggle(id: string) { setSelected(previous => previous.includes(id) ? previous.filter(key => key !== id) : [...previous, id]); }
  function toggleAll() { const ids = rows.map(row => row.id); setSelected(previous => ids.every(id => previous.includes(id)) ? previous.filter(id => !ids.includes(id)) : [...new Set([...previous, ...ids])]); }
  function toggleVisibility(_id:string) { notify.info('Backend chưa có API ẩn/hiện sản phẩm; trạng thái không thay đổi.'); }
  return { page:currentPage, setPage, totalPages, totalRows, products, loading, error, tab, setTab, query, setQuery, category, setCategory, condition, setCondition, sort, setSort, pageSize, setPageSize, selected, toggle, toggleAll, rows:pagedRows, toggleVisibility, action };
}
export type InventoryState = ReturnType<typeof useInventory>;
