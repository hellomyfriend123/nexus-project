import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sellerApi, messageOf, isUuid, nextOrderStatus, createShipment, updateShipment } from '../../../services/api/seller';
import type { Order, Shipment } from '../../../services/api/seller';
import { notify } from '../../../shared/components/Toast';
export function useOrderSuccess(){
 const [shipment,setShipment]=useState<Shipment|null>(null);
 const [params]=useSearchParams();const id=params.get('orderId')??'';
 const [order,setOrder]=useState<Order|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [checked,setChecked]=useState(false);const [busy,setBusy]=useState(false);const lock=useRef(false);
 useEffect(()=>{const c=new AbortController();setOrder(null);setShipment(null);setChecked(false);setError('');if(!isUuid(id)){setError('Chọn một đơn hàng hợp lệ từ Seller Hub.');setLoading(false);return;}setLoading(true);sellerApi.order(id,c.signal).then(setOrder).catch(e=>{if(!c.signal.aborted){setError(messageOf(e));notify.warning(messageOf(e));}}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[id]);
 async function transition(cancel=false){if(!order||lock.current)return;if(!cancel&&!checked){notify.warning('Vui lòng kiểm tra hàng và xác nhận trước khi cập nhật.');return;}lock.current=true;setBusy(true);try{setOrder(cancel?await sellerApi.cancelOrder(order.id):await sellerApi.updateOrder(order.id,nextOrderStatus[order.status]));setChecked(false);notify.success('Đã cập nhật trạng thái đơn hàng.');}catch(e){notify.warning(messageOf(e));}finally{lock.current=false;setBusy(false);}}
 async function shipmentAction(){if(!order||lock.current)return;lock.current=true;setBusy(true);try{if(shipment){const next=shipment.status==='PENDING'?'SHIPPED':shipment.status==='SHIPPED'?'DELIVERED':null;if(next)setShipment(await updateShipment(shipment.id,next));else notify.info('Vận đơn đã hoàn tất.');}else{if(!window.confirm('Tạo vận đơn cho đơn hàng này? Mã vận đơn do hệ thống tự sinh.'))return;setShipment(await createShipment(order.id));}notify.success('Đã lưu vận đơn.');}catch(e){notify.warning(messageOf(e));}finally{lock.current=false;setBusy(false);}}
 return {order,shipment,loading,error,checked,setChecked,busy,transition,shipmentAction};
}
export type OrderSuccessState = ReturnType<typeof useOrderSuccess>;
