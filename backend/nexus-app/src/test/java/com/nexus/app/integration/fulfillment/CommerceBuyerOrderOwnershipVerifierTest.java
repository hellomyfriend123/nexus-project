package com.nexus.app.integration.fulfillment;

import com.nexus.commerce.service.OrderService;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CommerceBuyerOrderOwnershipVerifierTest {

    @Test
    void verifiesOwnershipThroughCommerceOrderService() {
        OrderService orderService = mock(OrderService.class);
        CommerceBuyerOrderOwnershipVerifier verifier = new CommerceBuyerOrderOwnershipVerifier(orderService);
        UUID buyerId = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();

        verifier.verifyBuyerOwnsOrder(buyerId, orderId);

        verify(orderService).getBuyerOrder(buyerId, orderId);
    }
}
