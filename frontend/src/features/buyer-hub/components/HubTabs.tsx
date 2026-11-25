import type { BuyerHubTabId, HubTab } from '../types/buyerHub';

interface HubTabsProps {
  tabs: HubTab[];
  activeTab: BuyerHubTabId;
  onChange: (id: BuyerHubTabId) => void;
}

export default function HubTabs({ tabs, activeTab, onChange }: HubTabsProps) {
  return (
    <div className="nx-hub-tabs" role="tablist" aria-label="Khu vực quản lý người mua">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`hub-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`hub-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            className={`nx-hub-tab${isActive ? ' is-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            <i className={`bi ${tab.icon}`} aria-hidden="true"></i>
            <span>{tab.label}</span>
            <span
              className={`nx-hub-tab-count${
                tab.countTone === 'alert' ? ' nx-hub-tab-count--alert' : ''
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
