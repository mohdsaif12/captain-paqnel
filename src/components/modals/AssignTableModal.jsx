import { useState } from 'react';
import { X, User, Phone, Armchair } from 'lucide-react';
import './AssignTableModal.css';

function AssignTableModal({ table, onClose, onAssign, initialData }) {
  const [arrivalStatus, setArrivalStatus] = useState('seated');
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || '',
    phoneNumber: initialData?.phoneNumber || '',
    numberOfPeople: initialData?.numberOfPeople || '2',
    specialNote: initialData?.specialNote || '',
    tableId: table?.dbId || '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (onAssign) {
      onAssign({ ...formData, arrivalStatus });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} id="assign-table-modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()} id="assign-table-modal">
        {/* Header */}
        <div className="modal__header">
          <div className="modal__header-left">
            <div className="modal__header-icon">
              <Armchair />
            </div>
            <div className="modal__header-text">
              <h2>Assign Table {table?.id || 'T-02'}</h2>
              <span>Capacity: {table?.capacity || 2} Seats • Section: Main Hall</span>
            </div>
          </div>
          <button className="modal__close" onClick={onClose} id="btn-modal-close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal__body">
          {/* Customer Name + Phone */}
          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Customer Name</label>
              <div className="modal__input">
                <input
                  type="text"
                  placeholder="e.g. Robert Smith"
                  value={formData.customerName}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  id="input-customer-name"
                />
                <User />
              </div>
            </div>
            <div className="modal__field">
              <label className="modal__label">Phone Number</label>
              <div className="modal__input">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  id="input-phone-number"
                />
                <Phone />
              </div>
            </div>
          </div>

          {/* Number of People + Arrival Status */}
          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label">Number of People</label>
              <div className="modal__input">
                <select
                  value={formData.numberOfPeople}
                  onChange={(e) => handleChange('numberOfPeople', e.target.value)}
                  id="select-people-count"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Person' : 'People'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal__field">
              <label className="modal__label">Arrival Status</label>
              <div className="modal__toggle" id="arrival-status-toggle">
                <button
                  className={`modal__toggle-btn ${
                    arrivalStatus === 'seated' ? 'modal__toggle-btn--active' : ''
                  }`}
                  onClick={() => setArrivalStatus('seated')}
                >
                  Seated
                </button>
                <button
                  className={`modal__toggle-btn ${
                    arrivalStatus === 'reserved' ? 'modal__toggle-btn--active' : ''
                  }`}
                  onClick={() => setArrivalStatus('reserved')}
                >
                  Reserved
                </button>
              </div>
            </div>
          </div>

          {/* Special Note */}
          <div className="modal__field modal__field--full">
            <label className="modal__label">Special Note</label>
            <textarea
              className="modal__textarea"
              placeholder="Allergies, birthday celebration, quiet corner request..."
              value={formData.specialNote}
              onChange={(e) => handleChange('specialNote', e.target.value)}
              id="input-special-note"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal__footer">
          <button className="modal__btn-cancel" onClick={onClose} id="btn-modal-cancel">
            Cancel
          </button>
          <button className="modal__btn-submit" onClick={handleSubmit} id="btn-modal-assign">
            Assign Table
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignTableModal;
