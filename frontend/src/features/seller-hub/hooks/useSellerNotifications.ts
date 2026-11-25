import {useEffect,useState} from 'react';
import {headerApi} from '../../../services/api/header';
import {notify} from '../../../shared/components/Toast';
import type { SellerNotice } from '../types/sellerHub';
export function useSellerNotifications(){
  const [sellerNotices,setNotices]=useState<SellerNotice[]>([]);const [total,setTotal]=useState(0);
  useEffect(()=>{const c=new AbortController();headerApi.notifications(c.signal).then(page=>{setTotal(page.totalElements);setNotices(page.content.map(n=>({id:n.id,icon:'bell',tone:n.read?'neutral':'primary',title:n.title,body:n.content??'',time:new Date(n.createdAt).toLocaleString('vi-VN')})));}).catch(e=>{if(!c.signal.aborted)notify.warning(e instanceof Error?e.message:'Không thể tải thông báo.');});return()=>c.abort();},[]);
  async function view(id?:string){try{if(!id){await headerApi.readAll();setNotices(old=>old.map(n=>({...n,tone:'neutral'})));notify.success('Đã đánh dấu tất cả thông báo đã đọc.');return;}const n=await headerApi.notification(id);await headerApi.read(id);setNotices(old=>old.map(row=>row.id===id?{...row,tone:'neutral'}:row));notify.info(n.title+(n.content?' — '+n.content:''));}catch(e){notify.warning(e instanceof Error?e.message:'Không thể đọc thông báo.');}}
 return {sellerNotices,total,view};
}
