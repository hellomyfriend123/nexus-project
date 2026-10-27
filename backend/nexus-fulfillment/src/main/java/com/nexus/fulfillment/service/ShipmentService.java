package com.nexus.fulfillment.service;

import com.nexus.fulfillment.dto.common.ShipmentResponse;
import com.nexus.fulfillment.dto.seller.CreateShipmentRequest;
import com.nexus.fulfillment.dto.seller.UpdateShipmentStatusRequest;

import java.util.List;
import java.util.UUID;

/** FR-38, FR-39, FR-40 — vận đơn. */
public interface ShipmentService {

    /** FR-38 — Seller tạo vận đơn cho Order; status khởi tạo luôn là {@code PENDING}. */
    ShipmentResponse create(UUID sellerId, CreateShipmentRequest request);

    /** FR-39 — chỉ chuyển PENDING → SHIPPED → DELIVERED; chỉ Seller sở hữu vận đơn. */
    ShipmentResponse updateStatus(UUID sellerId, UUID shipmentId, UpdateShipmentStatusRequest request);

    /** FR-40 — Buyer xem vận đơn theo mã đơn hàng. */
    List<ShipmentResponse> listByOrderId(UUID orderId);
}
