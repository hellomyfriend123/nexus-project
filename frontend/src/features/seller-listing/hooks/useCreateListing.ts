import { validateListing } from './listingValidation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notify } from '../../../shared/components/Toast';
import { sellerApi, flatCategories, messageOf } from '../../../services/api/seller';
import type { Category } from '../../../services/api/seller';
import { assertProductRetryMatches, productCreationFingerprint } from '../../../shared/utils/productCreationRetry';
import type { PendingProductCreation } from '../../../shared/utils/productCreationRetry';
import { MAX_LISTING_IMAGES, persistListingImages, validateListingImage } from '../services/listingMedia';
import { initialListingDraft, listingAccessories } from '../services/listingDraft.mock';
import type { ListingDraftForm, ListingMediaSlot } from '../types/createListing';
const TITLE_MAX = 120;
const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
export function useCreateListing() {
  const navigate = useNavigate();
  const [draft,setDraft]=useState<ListingDraftForm>({...initialListingDraft,title:'',description:'',sku:'',price:0,dealPrice:0,quantity:1});
  const [category,setCategory]=useState('');const [categories,setCategories]=useState<Category[]>([]);
  const [condition,setCondition]=useState('like-new');const [saleModes,setSaleModes]=useState<string[]>(['fixed']);
  const [shippingPayer,setShippingPayer]=useState<'buyer'|'seller'>('buyer');const [accessories,setAccessories]=useState<string[]>(listingAccessories);
  const [media,setMedia]=useState<ListingMediaSlot[]>([]);const [saved,setSaved]=useState(false);const [errors,setErrors]=useState<string[]>([]);
  const [submitting,setSubmitting]=useState(false);const pendingProduct=useRef<PendingProductCreation|null>(null);const mutationLock=useRef(false);
  useEffect(()=>{const c=new AbortController();sellerApi.categories(c.signal).then(rows=>setCategories(flatCategories(rows).filter(c=>c.status==='ACTIVE'))).catch(e=>{if(!c.signal.aborted)notify.warning(messageOf(e));});return()=>c.abort();},[]);
  const urls = useRef(new Set<string>());
  const mediaRef = useRef<ListingMediaSlot[]>([]);
  const uploadedImages = useRef(new Map<string, string>());
  useEffect(() => () => { urls.current.forEach(url => URL.revokeObjectURL(url)); }, []);
  const mockAction = (label:string) => notify.info(label+' — backend chưa có API hỗ trợ.');
  function updateDraft<K extends keyof ListingDraftForm>(key: K, value: ListingDraftForm[K]) { setSaved(false); setDraft(previous => ({ ...previous, [key]: value })); }
  function toggleSaleMode(id: string) { setSaved(false); setSaleModes(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]); }
  function changeQuantity(delta: number) { updateDraft('quantity', Math.min(99, Math.max(1, draft.quantity + delta))); }
  function removeAccessory(name: string) { setSaved(false); setAccessories(previous => previous.filter(item => item !== name)); }
  function addMedia(files: File[]) {
    if (mutationLock.current) return;
    const added: ListingMediaSlot[] = [];
    for (const file of files) {
      const error = validateListingImage(file);
      if (error) { notify.warning(error); continue; }
      if (mediaRef.current.length + added.length >= MAX_LISTING_IMAGES) { notify.warning('Mỗi sản phẩm tối đa 9 ảnh.'); break; }
      const image = URL.createObjectURL(file);
      urls.current.add(image);
      added.push({ id: crypto.randomUUID(), label: file.name, image, file });
    }
    mediaRef.current = [...mediaRef.current, ...added].map((slot, index) => ({ ...slot, cover: index === 0 }));
    setMedia(mediaRef.current); setSaved(false);
  }
  function removeMedia(id: string) {
    if (mutationLock.current) return;
    const item = mediaRef.current.find(value => value.id === id);
    if (item && urls.current.delete(item.image)) URL.revokeObjectURL(item.image);
    uploadedImages.current.delete(id);
    mediaRef.current = mediaRef.current.filter(value => value.id !== id).map((slot, index) => ({ ...slot, cover: index === 0 }));
    setMedia(mediaRef.current); setSaved(false);
  }
  function saveDraft(){notify.info('Backend chưa có API lưu bản nháp. Không có dữ liệu được lưu.');}
  async function submitListing(){
    if(mutationLock.current)return;
    const next=validateListing(draft,category,saleModes);
    if(!draft.sku.trim()||draft.sku.trim().length>100)next.push('Nhập mã SKU tối đa 100 ký tự.');
    if(!categories.some(c=>c.id===category))next.push('Chọn danh mục từ hệ thống.');
    if(saleModes.some(m=>m!=='fixed'))next.push('Màn hình này chỉ hỗ trợ mua ngay; đấu giá/trả giá chưa được lưu.');
    setErrors(next);if(next.length){notify.warning(next[0]);return;}
    mutationLock.current=true;setSubmitting(true);
    try{
      const input={name:draft.title.trim(),description:draft.description.trim(),basePrice:draft.dealPrice,categoryId:category,images:[]};
      assertProductRetryMatches(pendingProduct.current,input);
      const id=pendingProduct.current?.id ?? (await sellerApi.createProduct(input)).id;
      pendingProduct.current={id,fingerprint:productCreationFingerprint(input)};
      // PUT replaces editable fields: preserve the guarded creation snapshot.
      // Finish media before SKU creation so upload retries cannot duplicate a SKU.
      await persistListingImages(id,mediaRef.current,uploadedImages.current,sellerApi.uploadProductImage,
        images => sellerApi.updateProduct(id,{name:input.name,description:input.description,basePrice:input.basePrice,images}));
      await sellerApi.createSku({productId:id,skuCode:draft.sku.trim(),name:input.name,price:input.basePrice,initialTotalQuantity:draft.quantity,initialAvailableQuantity:draft.quantity});
      pendingProduct.current=null;notify.success('Đã lưu sản phẩm, SKU và tồn kho.');navigate('/seller/products',{state:{listingPublished:true}});
    }catch(e){notify.warning(messageOf(e)+(pendingProduct.current?' Sản phẩm đã tạo; giữ nguyên tên, mô tả, giá và danh mục rồi thử lại để hoàn tất ảnh, SKU và tồn kho.':''));}finally{mutationLock.current=false;setSubmitting(false);}
  }
  const titleLength = draft.title.length;
  const discountPercent = draft.price > 0 ? Math.round(((draft.price - draft.dealPrice) / draft.price) * 100) : 0;
  const serviceFee = Math.round(draft.dealPrice * 0.03);
  const netEarnings = draft.dealPrice - serviceFee;
  const formatted = useMemo(() => ({ dealPrice: formatVnd(draft.dealPrice), price: formatVnd(draft.price), minOffer: formatVnd(draft.minOffer), serviceFee: formatVnd(serviceFee), netEarnings: formatVnd(netEarnings) }), [draft.dealPrice, draft.price, draft.minOffer, serviceFee, netEarnings]);
  return { categories, submitting, draft, updateDraft, category, setCategory, condition, setCondition, saleModes, toggleSaleMode, shippingPayer, setShippingPayer, accessories, removeAccessory, changeQuantity, titleLength, titleMax: TITLE_MAX, titleOverLimit: titleLength > TITLE_MAX, discountPercent, formatted, submitListing, mockAction, saveDraft, saved, errors, media, addMedia, removeMedia };
}
export type CreateListingState = ReturnType<typeof useCreateListing>;
