package com.nexus.app.integration.fulfillment;

import com.nexus.commerce.service.OrderService;
import com.nexus.fulfillment.service.BuyerOrderOwnershipVerifier;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Nối shipment tracking với cơ chế xác minh quyền sở hữu Order của commerce. */
@Component
public class CommerceBuyerOrderOwnershipVerifier implements BuyerOrderOwnershipVerifier {

    private final OrderService orderService;

    public CommerceBuyerOrderOwnershipVerifier(OrderService orderService) {
        this.orderService = orderService;
    }

    @Override
    public void verifyBuyerOwnsOrder(UUID buyerId, UUID orderId) {
        orderService.getBuyerOrder(buyerId, orderId);
    }
}
