package com.nexus.fulfillment.service.impl;

import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.fulfillment.dto.common.ShipmentResponse;
import com.nexus.fulfillment.dto.seller.CreateShipmentRequest;
import com.nexus.fulfillment.dto.seller.UpdateShipmentStatusRequest;
import com.nexus.fulfillment.entity.Shipment;
import com.nexus.fulfillment.enums.ShipmentStatus;
import com.nexus.fulfillment.mapper.ShipmentMapper;
import com.nexus.fulfillment.repository.ShipmentRepository;
import com.nexus.fulfillment.service.BuyerOrderOwnershipVerifier;
import com.nexus.fulfillment.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

/** FR-38, FR-39, FR-40. */
@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    /** Tiền tố mã vận đơn do hệ thống sinh: TRK-001, TRK-002, … */
    private static final String TRACKING_NUMBER_PREFIX = "TRK";

    private final ShipmentRepository shipmentRepository;
    private final BuyerOrderOwnershipVerifier buyerOrderOwnershipVerifier;

    @Override
    @Transactional
    public ShipmentResponse create(UUID sellerId, CreateShipmentRequest request) {
        // FR-38: orderId là bắt buộc (đã validate ở DTO, kiểm tra lại để service an toàn khi gọi nội bộ).
        if (request.orderId() == null) {
            throw new BusinessException("orderId không được để trống khi tạo vận đơn");
        }

        // TODO (giai đoạn business logic — nối nexus-commerce): kiểm tra Order tồn tại, thuộc sellerId
        //      và đã thanh toán thành công (FR-21) trước khi cho tạo vận đơn. Hiện chưa có module commerce
        //      trên classpath nên chỉ tạo bản ghi với dữ liệu do Seller cung cấp.
        // TODO (FR-38): chống tạo trùng vận đơn cho cùng một order — sẽ chốt luật khi nối commerce
        //      (một Order có thể được giao làm nhiều kiện hay không).

        Shipment shipment = Shipment.builder()
                .orderId(request.orderId())
                .sellerId(sellerId)
                .warehouseId(request.warehouseId())
                .trackingNumber(generateTrackingNumber())
                .status(ShipmentStatus.PENDING)
                .build();

        return ShipmentMapper.toResponse(shipmentRepository.save(shipment));
    }

    /**
     * Sinh mã vận đơn kế tiếp dạng {@code TRK-001}, {@code TRK-002}, …
     * <p>
     * Seller <b>không nhập tay</b> mã này nữa — hệ thống cấp mã, FE chỉ hiển thị lại
     * {@code ShipmentResponse.trackingNumber}. Số kế tiếp lấy từ mã lớn nhất đang có trong DB nên
     * đúng cả sau khi khởi động lại và sau khi có bản ghi bị xoá.
     */
    private String generateTrackingNumber() {
        int maxNumber = shipmentRepository.findTrackingNumbersStartingWith(TRACKING_NUMBER_PREFIX + "-").stream()
                .mapToInt(code -> SequentialCodeGenerator.numberOf(TRACKING_NUMBER_PREFIX, code))
                .max()
                .orElse(0);
        return SequentialCodeGenerator.next(TRACKING_NUMBER_PREFIX, maxNumber,
                shipmentRepository::existsByTrackingNumber);
    }

    @Override
    @Transactional
    public ShipmentResponse updateStatus(UUID sellerId, UUID shipmentId, UpdateShipmentStatusRequest request) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Vận đơn", shipmentId));

        // FR-39: chỉ Seller sở hữu vận đơn được cập nhật.
        if (sellerId != null && !Objects.equals(shipment.getSellerId(), sellerId)) {
            throw new ForbiddenOperationException(
                    "Bạn không có quyền cập nhật vận đơn của Seller khác");
        }

        ShipmentStatus current = shipment.getStatus();
        ShipmentStatus target = request.status();
        if (target == null) {
            throw new BusinessException("Trạng thái vận đơn mới không được để trống");
        }
        if (current == target) {
            throw new BusinessException("Vận đơn đã ở trạng thái " + current + ", không cần cập nhật");
        }
        // Chỉ cho phép đúng bước kế tiếp: PENDING → SHIPPED → DELIVERED.
        // Nhảy cóc (PENDING → DELIVERED) hoặc lùi trạng thái đều bị chặn.
        if (current.nextStatus() != target) {
            throw new BusinessException("Không thể chuyển trạng thái vận đơn từ " + current
                    + " sang " + target + ". Luồng hợp lệ: PENDING → SHIPPED → DELIVERED");
        }

        shipment.setStatus(target);
        return ShipmentMapper.toResponse(shipmentRepository.save(shipment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShipmentResponse> listByOrderId(UUID buyerId, UUID orderId) {
        if (orderId == null) {
            throw new BusinessException("Thiếu tham số orderId để tra cứu vận đơn");
        }
        if (buyerId == null) {
            throw new BusinessException("Thiếu Buyer hiện tại để tra cứu vận đơn");
        }
        buyerOrderOwnershipVerifier.verifyBuyerOwnsOrder(buyerId, orderId);
        return ShipmentMapper.toResponseList(shipmentRepository.findAllByOrderIdOrderByCreatedAtDesc(orderId));
    }
}
