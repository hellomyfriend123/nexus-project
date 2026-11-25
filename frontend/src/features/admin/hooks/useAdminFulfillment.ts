import { useState, useEffect, useCallback, useRef } from 'react';
import { adminNotify } from '../../../roles/administrator/layouts/AdminLayout';
import { adminFulfillmentApi } from '../services/admin.service';
import { loadAllAdminPages } from '../services/adminPagination';
import type {
  AdminInventoryItem,
  AdminWarehouse,
} from '../types/admin.types';


export function useAdminFulfillment() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'warehouses'>('inventory');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inventory State (1 task)
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');

  // Warehouse State (4 tasks)
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<AdminWarehouse | null>(null);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    address: '',
  });

  // FETCH DATA
  const requestRevision = useRef(0);
  const detailRevision = useRef(0);

  const loadData = useCallback(async () => {
    const revision = ++requestRevision.current;
    const isCurrent = () => revision === requestRevision.current;
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'inventory') {
        const warehousePage = await loadAllAdminPages((pagination) => adminFulfillmentApi.listWarehouses({  ...pagination }), isCurrent);
        if (!isCurrent()) return;
        setWarehouses(warehousePage.content);
        const res = await loadAllAdminPages((pagination) => adminFulfillmentApi.listInventories({ warehouseId: warehouseFilter === 'ALL' ? undefined : warehouseFilter,
          status: stockStatusFilter === 'ALL' ? undefined : stockStatusFilter, ...pagination }), isCurrent);
        if (!isCurrent()) return;
        if (res && Array.isArray(res.content)) {
          setInventory(res.content);
        } else {
          setInventory([]);
        }
      } else if (activeTab === 'warehouses') {
        const res = await loadAllAdminPages((pagination) => adminFulfillmentApi.listWarehouses({  ...pagination }), isCurrent);
        if (!isCurrent()) return;
        if (res && Array.isArray(res.content)) {
          setWarehouses(res.content);
        } else {
          setWarehouses([]);
        }
      }
    } catch (error) {
      if (!isCurrent()) return;
      setError(error instanceof Error ? error.message : 'Không thể tải dữ liệu.');
      if (activeTab === 'inventory') setInventory([]);
      else if (activeTab === 'warehouses') setWarehouses([]);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [activeTab, warehouseFilter, stockStatusFilter]);

  useEffect(() => {
    loadData();
    return () => { requestRevision.current += 1; detailRevision.current += 1; };
  }, [loadData]);

  // WAREHOUSE HANDLERS
  const handleOpenCreateWarehouse = () => {
    detailRevision.current += 1;
    setSelectedWarehouse(null);
    setWarehouseForm({
      name: '',
      code: '',
      address: '',
    });
    setShowWarehouseModal(true);
  };

  const handleOpenEditWarehouse = async (wh: AdminWarehouse) => {
    const revision = ++detailRevision.current;
    setSelectedWarehouse(wh);
    setWarehouseForm({
      name: wh.name,
      code: wh.code,
      address: wh.address || '',
    });
    setShowWarehouseModal(true);
    try {
      const freshWh = await adminFulfillmentApi.getWarehouse(wh.id);
      if (revision !== detailRevision.current) return;
      if (freshWh) {
        setSelectedWarehouse(freshWh);
        setWarehouseForm({
          name: freshWh.name,
          code: freshWh.code,
          address: freshWh.address || '',
        });
      }
    } catch (error) {
      if (revision !== detailRevision.current) return;
      setError(error instanceof Error ? error.message : 'Không thể tải chi tiết.');
    }
  };

  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseForm.name.trim() || !warehouseForm.address.trim()) return;

    try {
      if (selectedWarehouse) {
        await adminFulfillmentApi.updateWarehouse(selectedWarehouse.id, {
          name: warehouseForm.name.trim(),
          address: warehouseForm.address.trim(),
          status: (selectedWarehouse.status || 'ACTIVE') as any,
        });
        adminNotify.success('Đã cập nhật thông tin kho hàng', warehouseForm.name.trim());
      } else {
        if (!warehouseForm.code.trim()) return;
        await adminFulfillmentApi.createWarehouse({
          name: warehouseForm.name.trim(),
          code: warehouseForm.code.trim().toUpperCase(),
          address: warehouseForm.address.trim(),
        });
        adminNotify.success('Đã tạo mới kho hàng thành công', warehouseForm.name.trim());
      }
      setShowWarehouseModal(false);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      adminNotify.error('Không thể lưu kho hàng', errorMsg);
    }
  };

  const handleToggleWarehouseStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const wh = warehouses.find((w) => w.id === id);
      if (!wh) throw new Error('Warehouse is not loaded. Reload before changing its status.');
      await adminFulfillmentApi.updateWarehouse(id, {
        name: wh.name,
        address: wh.address,
        status: nextStatus as any,
      });
      adminNotify.success('Đã đổi trạng thái kho hàng', `Trạng thái mới: ${nextStatus}`);
      loadData();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi từ Backend';
      adminNotify.error('Không thể đổi trạng thái kho hàng', errorMsg);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchWh = warehouseFilter === 'ALL' || item.warehouseId === warehouseFilter;
    const matchStatus = stockStatusFilter === 'ALL' || item.status === stockStatusFilter;
    return matchWh && matchStatus;
  });

  return { activeTab, setActiveTab, error, setError, loading, setLoading, inventory, setInventory, warehouseFilter, setWarehouseFilter, stockStatusFilter, setStockStatusFilter, warehouses, setWarehouses, selectedWarehouse, setSelectedWarehouse, showWarehouseModal, setShowWarehouseModal, warehouseForm, setWarehouseForm, loadData, handleOpenCreateWarehouse, handleOpenEditWarehouse, handleSaveWarehouse, handleToggleWarehouseStatus, filteredInventory };
}
