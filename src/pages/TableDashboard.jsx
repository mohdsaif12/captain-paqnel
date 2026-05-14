import { useState } from 'react';
import { Grid3X3, CheckCircle2, AlertCircle, Clock, UserPlus } from 'lucide-react';
import StatCard from '../components/common/StatCard';
import FilterTabs from '../components/dashboard/FilterTabs';
import { TableCard, NewTableCard } from '../components/dashboard/TableCard';
import WaitlistPreview from '../components/dashboard/WaitlistPreview';
import AssignTableModal from '../components/modals/AssignTableModal';
import { useRestaurant } from '../context/RestaurantContext';
import './TableDashboard.css';

function TableDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const { tables, stats, loading, error, assignTable } = useRestaurant();

  const handleTableClick = (table) => {
    if (table.status === 'available') {
      setSelectedTable(table);
      setShowModal(true);
    }
  };

  const handleAssign = async (data) => {
    const result = await assignTable(selectedTable.dbId, data);
    if (result.success) {
      setShowModal(false);
      setSelectedTable(null);
    } else {
      alert('Failed to assign table: ' + result.error);
    }
  };

  if (loading && tables.length === 0) {
    return <div className="loading-container">Loading Dashboard...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div className="table-dashboard" id="table-dashboard-page">
      {/* Stats */}
      <div className="table-dashboard__stats">
        <StatCard label="Total Tables" value={stats.totalTables} icon={Grid3X3} variant="total" />
        <StatCard label="Available" value={stats.available} icon={CheckCircle2} variant="available" />
        <StatCard label="Occupied" value={stats.occupied} icon={AlertCircle} variant="occupied" />
        <StatCard label="Waiting" value={stats.waiting} icon={Clock} variant="waiting" />
      </div>

      {/* Toolbar */}
      <div className="table-dashboard__toolbar">
        <FilterTabs />
        <button
          className="table-dashboard__add-btn"
          onClick={() => {
            setSelectedTable(null);
            setShowModal(true);
          }}
          id="btn-add-to-waitlist"
        >
          <UserPlus />
          Add to Waitlist
        </button>
      </div>

      {/* Table Grid */}
      <div className="table-dashboard__grid" id="dashboard-table-grid">
        {tables.map((table) => (
          <TableCard key={table.dbId} table={table} onClick={handleTableClick} />
        ))}
        <NewTableCard onClick={() => {}} />
      </div>

      {/* Upcoming Waitlist */}
      <WaitlistPreview />

      {/* Assign Table Modal */}
      {showModal && (
        <AssignTableModal
          table={selectedTable}
          onClose={() => {
            setShowModal(false);
            setSelectedTable(null);
          }}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}

export default TableDashboard;
