import { Bell, Check, Clock } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import './PriorityCallsList.css';

function PriorityCallsList() {
  const { waiterCalls = [], completeWaiterCall } = useRestaurant();

  // Sort calls by created_at ascending (oldest first, i.e. highest wait time = highest priority)
  const sortedCalls = [...waiterCalls].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const formatElapsedTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    return `${diff}m ago`;
  };

  return (
    <section className="priority-calls" id="priority-calls-section">
      <h2 className="priority-calls__title">Priority Call List</h2>

      <div className="priority-calls__cards">
        {sortedCalls.length > 0 ? (
          sortedCalls.map((call) => (
            <div key={call.id} className="priority-call-card" id={`priority-call-card-${call.id}`}>
              <div className="priority-call-card__avatar">
                <Bell size={16} />
              </div>
              <div className="priority-call-card__info">
                <span className="priority-call-card__name">
                  Table {call.table_number || 'General'}
                </span>
                <span className="priority-call-card__meta">
                  <Clock size={12} />
                  {call.request_type || 'Call Waiter'} • {formatElapsedTime(call.created_at)}
                </span>
              </div>
              <button
                className="priority-call-card__action"
                onClick={() => completeWaiterCall(call.id)}
                title="Mark Resolved"
                id={`btn-resolve-call-${call.id}`}
              >
                <Check size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="priority-calls__empty">
            All calls resolved. No pending requests.
          </div>
        )}
      </div>
    </section>
  );
}

export default PriorityCallsList;
