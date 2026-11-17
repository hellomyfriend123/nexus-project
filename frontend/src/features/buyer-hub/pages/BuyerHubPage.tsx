import AuctionTab from '../components/AuctionTab';
import AuctionWinAlert from '../components/AuctionWinAlert';
import BuyerKpiGrid from '../components/BuyerKpiGrid';
import BuyerProfileCard from '../components/BuyerProfileCard';
import C2cTab from '../components/C2cTab';
import GuaranteeWidget from '../components/GuaranteeWidget';
import HubTabs from '../components/HubTabs';
import LiveFeedWidget from '../components/LiveFeedWidget';
import OrdersTab from '../components/OrdersTab';
import SavedCartTab from '../components/SavedCartTab';
import SupportWidget from '../components/SupportWidget';
import { useBuyerHubViewModel } from '../hooks/useBuyerHubViewModel';
import {
  c2cCategories,
  c2cDurations,
  guaranteeItems,
  hubCopy,
} from '../constants/buyerHub.constants';

/**
 * Buyer Hub — "Trung tâm Mua hàng & Quản lý Đấu giá".
 * Live orders and profile; unsupported backend capabilities retain empty states.
 */
export default function BuyerHubPage() {
  const {
    orderCount, loading, loadError, buyerProfile,
    displayKpis, displayTabs, displayAuctionFilters, displayOrderFilters,
    handleMoveToCart,
    activeTab,
    setActiveTab,
    auctionFilter,
    orderFilter,
    auctionSearch,
    setAuctionSearch,
    visibleBids,
    visibleOrders,
    winRemaining,
    items,
    selectedItemCount,
    savedSubtotal,
    c2cDraft,
    handleOpenC2c,
    handleBidAction,
    handleBidHistory,
    handleSelectAuctionFilter,
    handleSelectOrderFilter,
    handlePayment,
    handleWinDetail,
    handleTrackShipment,
    handleCancelOrder,
    handleReviewOrder,
    handleRebuy,
    handleToggleItem,
    handleSelectAllItems,
    handleQuantityChange,
    handleRemoveItem,
    handleCheckoutSelected,
    handleC2cViewBidders,
    handleC2cEndEarly,
    handleC2cDraftChange,
    handleC2cReset,
    handleC2cSubmit,
    handleLiveFeedAction,
    handleGuaranteeLink,
    handleComplaint,
    handleSupportChat,
  } = useBuyerHubViewModel();

  return (
    <main className="nx-hub-page">
      <div className="nx-container">

        <p className="nx-hub-empty" role="status">{loading ? "Đang tải dữ liệu..." : loadError || "Đơn hàng và hồ sơ được tải từ máy chủ. Backend chưa hỗ trợ danh sách đấu giá cá nhân, lưu sau, ví và chỉ số người mua."}</p>
        <BuyerProfileCard profile={buyerProfile} onCreateAuction={handleOpenC2c} />

        <BuyerKpiGrid kpis={displayKpis} timerSeconds={winRemaining} />

        <AuctionWinAlert notice={null} onViewDetail={handleWinDetail} onPay={handlePayment} />

        <div className="nx-hub-layout">
          <div className="nx-hub-main">
            <HubTabs tabs={displayTabs} activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'auctions' && (
              <AuctionTab
                filters={displayAuctionFilters}
                activeFilter={auctionFilter}
                search={auctionSearch}
                filterLabel={hubCopy.auctionFilterLabel}
                searchPlaceholder={hubCopy.auctionSearchPlaceholder}
                bids={visibleBids}
                onFilterChange={handleSelectAuctionFilter}
                onSearchChange={setAuctionSearch}
                onBidAction={handleBidAction}
                onBidHistory={handleBidHistory}
              />
            )}

            {activeTab === 'orders' && (
              <>

              <OrdersTab
                filters={displayOrderFilters}
                activeFilter={orderFilter}
                summary={`${orderCount} đơn hàng từ máy chủ`}
                orders={visibleOrders}
                onFilterChange={handleSelectOrderFilter}
                onTrack={handleTrackShipment}
                onCancel={handleCancelOrder}
                onReview={handleReviewOrder}
                onRebuy={handleRebuy}
              />
              </>
            )}

            {activeTab === 'cart' && (
              <SavedCartTab
                title="Sản phẩm đã lưu"
                summary="Backend chưa hỗ trợ danh sách lưu sau."
                selectAllLabel="Chọn tất cả để chuyển vào giỏ"
                items={items}
                selectedCount={selectedItemCount}
                subtotal={savedSubtotal}
                onToggle={handleToggleItem}
                onSelectAll={handleSelectAllItems}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemoveItem}
                onMoveToCart={handleMoveToCart}
                onCheckout={handleCheckoutSelected}
              />
            )}

            {activeTab === 'c2c' && (
              <C2cTab
                title={hubCopy.c2cTitle}
                subtitle={hubCopy.c2cSubtitle}
                activeLabel={hubCopy.c2cActiveLabel}
                formTitle={hubCopy.c2cFormTitle}
                auction={null}
                categories={c2cCategories}
                durations={c2cDurations}
                draft={c2cDraft}
                onViewBidders={handleC2cViewBidders}
                onEndEarly={handleC2cEndEarly}
                onDraftChange={handleC2cDraftChange}
                onReset={handleC2cReset}
                onSubmit={handleC2cSubmit}
              />
            )}
          </div>

          <aside className="nx-hub-aside">
            <LiveFeedWidget
              title={hubCopy.liveFeedTitle}
              items={[]}
              onAction={handleLiveFeedAction}
            />
            <GuaranteeWidget
              title={hubCopy.guaranteeTitle}
              subtitle={hubCopy.guaranteeSubtitle}
              items={guaranteeItems}
              linkLabel={hubCopy.guaranteeLink}
              onLink={handleGuaranteeLink}
            />
            <SupportWidget
              title={hubCopy.supportTitle}
              body={hubCopy.supportBody}
              onComplaint={handleComplaint}
              onChat={handleSupportChat}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
