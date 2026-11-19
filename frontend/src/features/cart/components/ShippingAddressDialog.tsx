import { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import type { DeliveryAddress } from '../types/cart';

export default function ShippingAddressDialog({ address, onClose, onSave }: { address: DeliveryAddress; onClose: () => void; onSave: (name: string, phone: string, address: string) => string }) {
  const [name, setName] = useState(address.receiverName);
  const [phone, setPhone] = useState(address.phone);
  const [line, setLine] = useState(address.line);
  const [error, setError] = useState('');
  return <Modal show onHide={onClose} centered aria-labelledby="cart-address-edit-title"><form onSubmit={event => { event.preventDefault(); setError(onSave(name, phone, line)); }}>
    <Modal.Header closeButton closeLabel="Đóng chỉnh sửa địa chỉ"><Modal.Title as="h2" id="cart-address-edit-title" className="fs-5">Địa chỉ nhận hàng</Modal.Title></Modal.Header>
    <Modal.Body><label htmlFor="cart-receiver-name" className="form-label">Tên người nhận</label><input id="cart-receiver-name" className="form-control mb-3" value={name} onChange={event => setName(event.target.value)} autoComplete="shipping name" required />
      <label htmlFor="cart-receiver-phone" className="form-label">Số điện thoại</label><input id="cart-receiver-phone" className="form-control mb-3" type="tel" value={phone} onChange={event => setPhone(event.target.value)} autoComplete="shipping tel" required />
      <label htmlFor="cart-receiver-address" className="form-label">Địa chỉ đầy đủ</label><textarea id="cart-receiver-address" className="form-control" rows={3} value={line} onChange={event => setLine(event.target.value)} autoComplete="shipping street-address" required />
      {error && <p className="text-danger mt-3" role="alert">{error}</p>}
    </Modal.Body><Modal.Footer><button type="button" className="btn btn-light" onClick={onClose}>Quay lại</button><button className="btn btn-primary" type="submit">Lưu địa chỉ</button></Modal.Footer>
  </form></Modal>;
}
