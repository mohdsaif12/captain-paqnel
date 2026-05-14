import {
  X,
  ArrowRightLeft,
  Receipt,
  Unlock,
  StickyNote,
} from 'lucide-react';
import { tableDetail } from '../../data/mockData';
import './TableDetailPanel.css';

function TableDetailPanel({ table, onClose }) {
  const detail = tableDetail;

  return (
    <aside className="detail-panel" id="table-detail-panel">
      {/* Header */}
      <div className="detail-panel__header">
        <div className="detail-panel__title-group">
          <h2 className="detail-panel__title">Table {detail.id}</h2>
          <span className="detail-panel__subtitle">{detail.statusLabel}</span>
        </div>
        <button className="detail-panel__close" onClick={onClose} id="btn-close-detail">
          <X size={18} />
        </button>
      </div>

      {/* Current Status */}
      <div className="detail-panel__status">
        <p className="detail-panel__status-label">Current Status</p>
        <p className="detail-panel__status-value">{detail.currentStatus}</p>
      </div>

      {/* Customer Info */}
      <div className="detail-panel__info">
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">Customer Name</span>
          <span className="detail-panel__info-value">
            <span className="detail-panel__info-avatar">SJ</span>
            {detail.customerName}
          </span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">People</span>
          <span className="detail-panel__info-value">{detail.people}</span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">Time Seated</span>
          <span className="detail-panel__info-value">{detail.timeSeated}</span>
        </div>
        <div className="detail-panel__info-item">
          <span className="detail-panel__info-label">Server</span>
          <span className="detail-panel__info-value">{detail.server}</span>
        </div>
      </div>

      {/* Active Order */}
      <div className="detail-panel__orders">
        <div className="detail-panel__orders-header">
          <span className="detail-panel__orders-title">Active Order</span>
          <span className="detail-panel__orders-link" id="btn-view-full-ticket">
            View Full Ticket
          </span>
        </div>

        {detail.orders.map((order, idx) => (
          <div key={idx} className="order-item">
            <div className="order-item__info">
              <span className="order-item__name">
                {order.qty}x {order.name}
              </span>
              <span className="order-item__note">{order.note}</span>
            </div>
            <span className="order-item__price">
              ${order.price.toFixed(2)}
            </span>
          </div>
        ))}

        <div className="detail-panel__subtotal">
          <span className="detail-panel__subtotal-label">Subtotal</span>
          <span className="detail-panel__subtotal-value">
            ${detail.subtotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Manager Notes */}
      <div className="detail-panel__notes">
        <div className="detail-panel__notes-box">
          <p className="detail-panel__notes-title">
            <StickyNote />
            Manager Notes
          </p>
          <p className="detail-panel__notes-text">
            &ldquo;{detail.managerNote}&rdquo;
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="detail-panel__actions">
        <div className="detail-panel__actions-row">
          <button className="detail-panel__btn detail-panel__btn--outline" id="btn-move-table">
            <ArrowRightLeft />
            Move Table
          </button>
          <button className="detail-panel__btn detail-panel__btn--primary" id="btn-mark-billing">
            <Receipt />
            Mark Billing
          </button>
        </div>
        <button className="detail-panel__btn detail-panel__btn--secondary" id="btn-free-table">
          <Unlock />
          Free Table
        </button>
      </div>
    </aside>
  );
}

export default TableDetailPanel;
