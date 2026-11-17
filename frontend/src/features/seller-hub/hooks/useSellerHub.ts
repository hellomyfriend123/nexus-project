import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../../../services/api/auth';
import { notify } from '../../../shared/components/Toast';
import { sellerApi, productImagesForUpdate, loadSellerInventory, loadSellerOrders, flatCategories, messageOf, loadSellerAuctions, mutateAuction, cancelAuction } from '../../../services/api/seller';
import type { Category, Order } from '../../../services/api/seller';
import { assertProductRetryMatches, productCreationFingerprint } from '../../../shared/utils/productCreationRetry';
import type { PendingProductCreation } from '../../../shared/utils/productCreationRetry';
import type { ListingDraft, ProductStatus, SellerTabId, SellerProduct, SellerOrder, SellerAuction } from '../types/sellerHub';
export function useSellerHub() {
 const navigate=useNavigate();const [auctions,setAuctions]=useState<SellerAuction[]>([]);
 const [activeTab,setActiveTab]=useState<SellerTabId>('products');
 const [products,setProducts]=useState<SellerProduct[]>([]);
 const [apiOrders,setApiOrders]=useState<Order[]>([]);
 const [categories,setCategories]=useState<Category[]>([]);
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const [draft,setDraft]=useState<ListingDraft>({name:'',category:'',price:'',stock:'0',buyNow:true,makeOffer:false});
 const [search,setSearch]=useState('');const [status,setStatus]=useState('all');const [sort,setSort]=useState('default');
 const [page,setPage]=useState(1);const [orderPage,setOrderPage]=useState(1);
 const [selected,setSelected]=useState<string[]>([]);const [collapsed,setCollapsed]=useState(false);const [imageNames,setImageNames]=useState<string[]>([]);
 const [auctionFilter,setAuctionFilter]=useState('all');const [orderFilter,setOrderFilter]=useState('all');const [reportRange,setReportRange]=useState('6m');
 const nameRef=useRef<HTMLInputElement>(null);const mutationLock=useRef(false);const pendingProduct=useRef<PendingProductCreation|null>(null);
 useEffect(()=>{const controller=new AbortController();
 Promise.all([loadSellerInventory(controller.signal),loadSellerOrders(controller.signal),sellerApi.categories(controller.signal)]).then(([data,orders,cats])=>{
 setApiOrders(orders);setCategories(flatCategories(cats).filter(c=>c.status==='ACTIVE'));
 setProducts(data.inventories.map(row=>{const p=data.products.get(row.productId)!;return {id:row.id,productId:p.id,description:p.description??'',images:p.images,primaryImageUrl:p.primaryImageUrl,name:p.name,sku:row.skuCode,category:p.categoryName,image:p.primaryImageUrl??p.images[0]??'',stock:row.availableQuantity,status:row.availableQuantity===0||row.status==='LOW_STOCK'?'low':'ready',price:Number(p.basePrice),note:p.status};}));
 }).catch(e=>{if(!controller.signal.aborted){setError(messageOf(e));notify.warning(messageOf(e));}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[]);
 const mockAction=(label:string)=>label.includes('Tạo phiên')?void auctionAction(label):notify.info(label+' — chưa có API hỗ trợ trong màn hình này.');
 const visibleProducts=useMemo(()=>{const q=search.trim().toLocaleLowerCase('vi');const rows=products.filter(p=>(p.name+' '+p.sku).toLocaleLowerCase('vi').includes(q)&&(status==='all'||p.status===status as ProductStatus));if(sort!=='default')rows.sort((a,b)=>sort==='stock-desc'?b.stock-a.stock:a.stock-b.stock);return rows;},[products,search,status,sort]);
 useEffect(()=>{const c=new AbortController();const userId=getSession()?.userId;if(!userId)return;loadSellerAuctions(userId,c.signal).then(async rows=>{const mapped=await Promise.all(rows.map(async a=>{const p=await sellerApi.product(a.productId,c.signal);return{id:a.id,productId:a.productId,startTime:a.startTime,endTime:a.endTime,backendStatus:a.status,roomCode:a.id,product:p.name,sku:'—',image:p.primaryImageUrl??p.images[0]??'',currentBid:Number(a.currentPrice),startPrice:Number(a.startingPrice),bids:a.acceptedBidCount??0,watchers:'Chưa có API',endsIn:new Date(a.endTime).toLocaleString('vi-VN'),state:a.status==='ACTIVE'?'live' as const:a.status as SellerAuction['state'],topBidder:a.highestBidderId??'—'};}));setAuctions(mapped);}).catch(e=>{if(!c.signal.aborted)notify.warning(messageOf(e));});return()=>c.abort();},[]);
 const visibleAuctions=auctions.filter(a=>auctionFilter==='all'||a.state===auctionFilter);
 async function auctionAction(label:string,id?:string){if(!id&&label.includes('Tạo phiên')){navigate('/seller/auctions/new');return;}if(mutationLock.current)return;const row=auctions.find(a=>a.id===id);if(label==='Sàn bid'&&id){navigate('/products/'+row?.productId+'?auctionId='+encodeURIComponent(id));return;}mutationLock.current=true;try{if(label==='Hủy phiên'&&id){if(!window.confirm('Hủy phiên đấu giá này?'))return;await cancelAuction(id);setAuctions(old=>old.map(a=>a.id===id?{...a,state:'CANCELLED',backendStatus:'CANCELLED'}:a));notify.success('Đã hủy phiên.');return;}
 if(label==='Chỉnh sửa phiên'&&row?.backendStatus!=='SCHEDULED'){notify.info('Chỉ được sửa phiên SCHEDULED.');return;}
 const productId=row?.productId??window.prompt('ID sản phẩm của bạn:')?.trim();if(!productId)return;
 const price=window.prompt('Giá khởi điểm:',String(row?.startPrice??''));if(price===null)return;const start=window.prompt('Thời gian bắt đầu (ISO 8601):',row?.startTime??'');if(start===null)return;const end=window.prompt('Thời gian kết thúc (ISO 8601):',row?.endTime??'');if(end===null)return;
 if(!Number.isFinite(Number(price))||Number(price)<=0||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||Date.parse(end)<=Date.parse(start)){notify.warning('Giá và khoảng thời gian không hợp lệ.');return;}
 await mutateAuction(id??null,{...(!id?{productId}:{}),startingPrice:Number(price),startTime:new Date(start).toISOString(),endTime:new Date(end).toISOString()});notify.success('Đã lưu cấu hình đấu giá. Tải lại trang để xem dữ liệu mới nhất.');
 }catch(e){notify.warning(messageOf(e));}finally{mutationLock.current=false;}}

 const statusMap:Record<string,SellerOrder['status']>={PENDING:'pending',CONFIRMED:'packing',SHIPPING:'shipping',COMPLETED:'done',CANCELLED:'cancelled'};
 const orders:SellerOrder[]=apiOrders.map(o=>({id:o.id,code:o.orderNumber,buyer:o.receiverName??'Xem chi tiết đơn',contact:o.receiverPhone??'—',items:o.items?.map(i=>i.productNameSnapshot).join(', ')??'Xem chi tiết đơn',itemCount:String(o.itemCount??o.items?.length??'—'),total:Number(o.totalAmount),method:'Xem chi tiết vận chuyển',express:false,status:statusMap[o.status]??'pending',placedAt:new Date(o.createdAt).toLocaleString('vi-VN'),deadline:'—'}));
 const visibleOrders=orders.filter(o=>orderFilter==='all'||o.status===orderFilter);const pendingOrders=orders.filter(o=>o.status==='pending').length;
 const orderCounts=Object.fromEntries(['all','pending','packing','shipping','done','cancelled'].map(s=>[s,s==='all'?orders.length:orders.filter(o=>o.status===s).length]));
 function updateDraft<K extends keyof ListingDraft>(key:K,value:ListingDraft[K]){setDraft(p=>({...p,[key]:value}));}
 function toggleSelected(id:string){setSelected(p=>p.includes(id)?p.filter(v=>v!==id):[...p,id]);}
 function toggleAll(){const ids=visibleProducts.map(p=>p.id);setSelected(p=>ids.every(id=>p.includes(id))?p.filter(id=>!ids.includes(id)):[...new Set([...p,...ids])]);}
 async function changeStock(id:string,delta:number){if(mutationLock.current)return;mutationLock.current=true;setBusy(true);try{const row=await sellerApi.updateInventory(id,delta>0?'INCREASE':'DECREASE',Math.abs(delta));setProducts(p=>p.map(v=>v.id===id?{...v,stock:row.availableQuantity,status:row.availableQuantity===0||row.status==='LOW_STOCK'?'low':'ready'}:v));}catch(e){notify.warning(messageOf(e));}finally{mutationLock.current=false;setBusy(false);}}
 async function submitListing(){
 if(mutationLock.current)return;
 const price=Number(draft.price),quantity=Number(draft.stock);
 if(!draft.name.trim()||!Number.isFinite(price)||price<=0||!draft.stock||!Number.isInteger(quantity)||quantity<0||!categories.some(c=>c.id===draft.category)){notify.warning('Nhập tên, danh mục, giá và tồn kho hợp lệ.');return;}
 if(draft.makeOffer||!draft.buyNow){notify.warning('Chỉ hỗ trợ mua ngay. Backend chưa có cấu hình trả giá trong sản phẩm.');return;}
 const skuCode=window.prompt('Nhập mã SKU cho sản phẩm (bắt buộc, tối đa 100 ký tự):')?.trim();if(!skuCode)return;if(skuCode.length>100){notify.warning('Mã SKU tối đa 100 ký tự.');return;}
 mutationLock.current=true;setBusy(true);
 try{
 const input={name:draft.name.trim(),description:'',basePrice:price,categoryId:draft.category,images:[]};
 assertProductRetryMatches(pendingProduct.current,input);
 const id=pendingProduct.current?.id??(await sellerApi.createProduct(input)).id;
 pendingProduct.current={id,fingerprint:productCreationFingerprint(input)};
 await sellerApi.createSku({productId:id,skuCode,name:input.name,price,initialTotalQuantity:quantity,initialAvailableQuantity:quantity});
 pendingProduct.current=null;
 // Creation is complete even if the subsequent inventory read fails. Clear the
 // form now so retrying a failed refresh cannot create the same listing again.
 setDraft({name:'',category:'',price:'',stock:'0',buyNow:true,makeOffer:false});
 setImageNames([]);
 notify.success('Đã tạo sản phẩm và SKU. Đang tải lại kho.');
 try{const data=await loadSellerInventory();setProducts(data.inventories.map(row=>{const p=data.products.get(row.productId)!;return{id:row.id,productId:p.id,description:p.description??'',images:p.images,primaryImageUrl:p.primaryImageUrl,name:p.name,sku:row.skuCode,category:p.categoryName,image:p.primaryImageUrl??p.images[0]??'',stock:row.availableQuantity,status:row.availableQuantity===0||row.status==='LOW_STOCK'?'low':'ready',price:Number(p.basePrice),note:p.status};}));}
 catch(e){notify.warning('Sản phẩm và SKU đã được tạo thành công, nhưng chưa tải lại được kho. Hãy tải lại trang để xem; không gửi lại sản phẩm. '+messageOf(e));}
 }catch(e){notify.warning(messageOf(e)+(pendingProduct.current?' Sản phẩm đã tạo. Giữ nguyên thông tin sản phẩm, chỉ sửa mã SKU hoặc số lượng rồi thử lại để hoàn tất tồn kho.':''));}finally{mutationLock.current=false;setBusy(false);}
 }

 async function productAction(label:string,id:string){const row=products.find(p=>p.id===id);if(!row?.productId||mutationLock.current)return;mutationLock.current=true;setBusy(true);try{
 if(label==='Xóa sản phẩm'){if(!window.confirm('Xóa sản phẩm này?'))return;await sellerApi.deleteProduct(row.productId);setProducts(old=>old.filter(p=>p.productId!==row.productId));notify.success('Đã xóa sản phẩm.');return;}
 if(label==='Chỉnh sửa sản phẩm'||label==='Quản lý giá'){const name=window.prompt('Tên sản phẩm:',row.name);if(name===null)return;const description=window.prompt('Mô tả:',row.description??'');if(description===null)return;const amount=window.prompt('Giá bán:',String(row.price));if(amount===null)return;const basePrice=Number(amount);if(!name.trim()||!Number.isFinite(basePrice)||basePrice<=0){notify.warning('Tên và giá không hợp lệ.');return;}const p=await sellerApi.updateProduct(row.productId,{name:name.trim(),description,basePrice,images:productImagesForUpdate(row)});setProducts(old=>old.map(v=>v.productId===p.id?{...v,name:p.name,description:p.description??'',price:Number(p.basePrice)}:v));notify.success('Đã cập nhật sản phẩm.');return;}
 mockAction(label);
 }catch(e){notify.warning(messageOf(e));}finally{mutationLock.current=false;setBusy(false);}}
 function focusListing(){setCollapsed(false);requestAnimationFrame(()=>nameRef.current?.focus());}
 return {auctionAction,page,setPage,totalPages:Math.max(1,Math.ceil(visibleProducts.length/10)),orderPage,setOrderPage,orderPages:Math.max(1,Math.ceil(visibleOrders.length/10)),productAction,loading,error,busy,categories,activeTab,setActiveTab,draft,updateDraft,search,setSearch,status,setStatus,sort,setSort,selected,toggleSelected,toggleAll,collapsed,setCollapsed,imageNames,setImageNames,nameRef,visibleProducts:visibleProducts.slice((Math.min(page,Math.max(1,Math.ceil(visibleProducts.length/10)))-1)*10,Math.min(page,Math.max(1,Math.ceil(visibleProducts.length/10)))*10),changeStock,submitListing,focusListing,mockAction,auctionFilter,setAuctionFilter,visibleAuctions,orderFilter,setOrderFilter,visibleOrders:visibleOrders.slice((Math.min(orderPage,Math.max(1,Math.ceil(visibleOrders.length/10)))-1)*10,Math.min(orderPage,Math.max(1,Math.ceil(visibleOrders.length/10)))*10),pendingOrders,orderCounts,reportRange,setReportRange};
}
export type SellerHubState=ReturnType<typeof useSellerHub>;
