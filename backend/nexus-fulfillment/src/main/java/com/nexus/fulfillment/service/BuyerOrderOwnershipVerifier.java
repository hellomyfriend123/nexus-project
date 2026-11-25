package com.nexus.fulfillment.service;

import java.util.UUID;

/** Cổng xác minh Order thuộc Buyer, tránh để fulfillment phụ thuộc trực tiếp vào commerce. */
public interface BuyerOrderOwnershipVerifier {

    void verifyBuyerOwnsOrder(UUID buyerId, UUID orderId);
}
