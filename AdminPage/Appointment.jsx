import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

// StatCard Component
const StatCard = ({ title, value, icon, bgColor, iconColor }) => (
  <div className="bg-white p-7 rounded-2xl shadow-md">
    <div className="flex justify-between items-center mb-4">
      <span className="text-sm text-gray-600 font-medium">{title}</span>
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{ background: bgColor, color: iconColor }}
      >
        {icon}
      </div>
    </div>
    <div className="text-5xl font-bold text-gray-800">{value}</div>
  </div>
);

// TodayAppointments Component
const TodayAppointments = ({ appointments }) => (
  <div className="bg-white p-7 rounded-2xl shadow-lg">
    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-200">
      <span className="text-base font-semibold text-gray-800">Today's Appointment</span>
      <span className="text-xl">📅</span>
    </div>
    <div className="space-y-1">
      {appointments.map((apt, idx) => (
        <div 
          key={idx} 
          className="flex justify-between py-2 text-sm border-b border-gray-100 last:border-0"
        >
          <span className="text-gray-700">{apt.time}</span>
          <span className="font-semibold text-gray-800">{apt.count}</span>
        </div>
      ))}
    </div>
    <button className="text-sm text-gray-700 mt-4 hover:underline transition-all">
      see more
    </button>
  </div>
);

// FilterBar Component
const FilterBar = ({ serviceFilter, statusFilter, onServiceChange, onStatusChange }) => (
  <div className="flex gap-4 mb-8 flex-wrap">
    <select
      value={serviceFilter}
      onChange={(e) => onServiceChange(e.target.value)}
      className="px-5 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 text-sm font-medium cursor-pointer shadow-sm hover:border-teal-500 hover:shadow-md focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all"
    >
      <option value="">Service Type</option>
      <option value="customization">Customization</option>
      <option value="drycleaning">Dry Cleaning</option>
      <option value="rental">Rental</option>
      <option value="repair">Repair</option>
    </select>

    <select
      value={statusFilter}
      onChange={(e) => onStatusChange(e.target.value)}
      className="px-5 py-3 border border-gray-200 rounded-xl bg-white text-gray-800 text-sm font-medium cursor-pointer shadow-sm hover:border-teal-500 hover:shadow-md focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition-all"
    >
      <option value="">Status</option>
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="declined">Declined</option>
    </select>
  </div>
);

// AppointmentsTable Component
const AppointmentsTable = ({ appointments, onApprove, onDecline }) => (
  <div className="bg-white rounded-2xl shadow-md overflow-hidden">
    <table className="w-full">
      <thead className="bg-white">
        <tr>
          <th className="px-6 py-5 text-left text-xs font-semibold text-[#6A3C3E] uppercase tracking-wide">
            Name
          </th>
          <th className="px-6 py-5 text-left text-xs font-semibold text-[#6A3C3E] uppercase tracking-wide">
            Service Type
          </th>
          <th className="px-6 py-5 text-left text-xs font-semibold text-[#6A3C3E] uppercase tracking-wide">
            Date
          </th>
          <th className="px-6 py-5 text-left text-xs font-semibold text-[#6A3C3E] uppercase tracking-wide">
            Time
          </th>
          <th className="px-6 py-5 text-left text-xs font-semibold text-[#6A3C3E] uppercase tracking-wide">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {appointments.length === 0 ? (
          <tr>
            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm">
              No appointments yet. User information will appear here after booking.
            </td>
          </tr>
        ) : (
          appointments.map((apt) => (
            <tr 
              key={apt.id} 
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0"
            >
              <td className="px-6 py-5 text-sm text-gray-800">{apt.name}</td>
              <td className="px-6 py-5 text-sm text-gray-700">{apt.serviceType}</td>
              <td className="px-6 py-5 text-sm text-gray-700">{apt.date}</td>
              <td className="px-6 py-5 text-sm text-gray-700">{apt.time}</td>
              <td className="px-6 py-5">
                <div className="flex gap-3">
                  <button
                    onClick={() => onApprove(apt.id)}
                    className="px-5 py-2.5 bg-gradient-to-br from-green-500 to-green-600 text-white text-xs font-semibold uppercase tracking-wide rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDecline(apt.id)}
                    className="px-5 py-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-semibold uppercase tracking-wide rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

// ConfirmModal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white p-9 rounded-2xl text-center w-96 shadow-2xl animate-slideUp">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Confirm Action
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          {message}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="px-7 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Yes
          </button>
          <button
            onClick={onClose}
            className="px-7 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 hover:-translate-y-0.5 transition-all"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function AppointmentsDashboard() {
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);

  // Sample appointments data - starts empty, will populate when users book
  const [appointments, setAppointments] = useState([
    { id: 1, name: 'John Doe', serviceType: 'Customization', date: '2025-11-18', time: '9:00 AM', status: 'pending' },
    { id: 2, name: 'Jane Smith', serviceType: 'Dry Cleaning', date: '2025-11-18', time: '10:00 AM', status: 'pending' },
    { id: 3, name: 'Mike Johnson', serviceType: 'Rental', date: '2025-11-18', time: '11:00 AM', status: 'pending' }
  ]);

  const todayAppointments = [
    { time: '9:00am', count: 5 },
    { time: '8:00am', count: 3 },
    { time: '7:00am', count: 2 }
  ];

  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const approvedCount = appointments.filter(a => a.status === 'approved').length;

  const handleApprove = (id) => {
    setModalAction({ type: 'approve', id });
    setModalOpen(true);
  };

  const handleDecline = (id) => {
    setModalAction({ type: 'decline', id });
    setModalOpen(true);
  };

  const confirmAction = () => {
    if (modalAction.type === 'approve') {
      setAppointments(prev => 
        prev.map(apt => apt.id === modalAction.id ? { ...apt, status: 'approved' } : apt)
      );
    } else {
      setAppointments(prev => prev.filter(apt => apt.id !== modalAction.id));
    }
    setModalOpen(false);
    setModalAction(null);
  };

  const filteredAppointments = appointments.filter(apt => {
    if (serviceFilter && apt.serviceType.toLowerCase() !== serviceFilter.toLowerCase()) return false;
    if (statusFilter && apt.status !== statusFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="bg-[#F5F6FA] min-h-screen font-['Poppins']">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: scale(0.9) translateY(-20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease;
        }
      `}</style>

      <Sidebar activeMenu="Appointments" />
      <Navbar />
      
      <main className="ml-[270px] mt-[70px] p-10 min-h-[calc(100vh-70px)]">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Appointment</h2>
          <p className="text-sm text-gray-600">Manage customer appointments and scheduling</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Pending Requests"
            value={pendingCount}
            icon="🔄"
            bgColor="#e3f2fd"
            iconColor="#2196f3"
          />
          <StatCard
            title="Approved Requests"
            value={approvedCount}
            icon="✓"
            bgColor="#e8f5e9"
            iconColor="#4caf50"
          />
          <TodayAppointments appointments={todayAppointments} />
        </div>

        <FilterBar
          serviceFilter={serviceFilter}
          statusFilter={statusFilter}
          onServiceChange={setServiceFilter}
          onStatusChange={setStatusFilter}
        />

        <AppointmentsTable
          appointments={filteredAppointments}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />
      </main>

      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmAction}
        message={
          modalAction?.type === 'approve'
            ? 'Are you sure you want to approve this appointment?'
            : 'Are you sure you want to decline this appointment?'
        }
      />
    </div>
  );
}