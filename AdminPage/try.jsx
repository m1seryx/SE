import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import "../Styles/appointments.css"
import { AppointmentGetAll, HandleAccept } from './api/appointmentService'; 


export default function AdminAppointmentPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("Pending");
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [search, setSearch] = useState("");

useEffect(() => {
    async function fetchAllAppointments() {
      try {
        const { success, appointments, message } = await AppointmentGetAll();
        if (success) {   
          const formattedAppointments = appointments.map(appt => ({
            id: appt.appointment_id,
            name: `${appt.first_name} ${appt.last_name}`,
            service: appt.serviceType,
            date: new Date(appt.date_time).toLocaleDateString(),
            time: new Date(appt.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            status: appt.status
          }));
          setAppointments(formattedAppointments);
        } else {
          console.error('Failed to fetch appointments:', message);
          setError(message || 'Failed to load appointments');
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('An error occurred while loading appointments');
      } finally {
        setLoading(false);
      }
    }
    fetchAllAppointments();
  }, [])

const getAvailableTimes = (service) => {
        return ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00']; // Example times
    };

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const tabMatch = a.status === activeTab;
      if (!search.trim()) return tabMatch;
      const q = search.trim().toLowerCase();
      return tabMatch && (a.serviceType.toLowerCase().includes(q));
    });
  }, [appointments, activeTab, search]);

  const updateStatus = (id, newStatus) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt)
    );
  };

  const updateTime = (id, newTime) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === id ? { ...apt, time: newTime } : apt)
    );
  };

const handleAccept = async (id) => {
        setError(null);
        setIsAccepting(true);
        try {
          const { success, message } = await HandleAccept(id);
          if (success) {
            updateStatus(id, "Accepted");
       
          } else {
            setError(message || 'Failed to accept appointment');
        
          }
        } catch (error) {
          console.error('Error accepting appointment:', error);
          setError('An error occurred while accepting the appointment');
        
        } finally {
          setIsAccepting(false);
        }
      };
        const handleDecline = (id) => {
          if (!confirm("Are you sure you want to decline this appointment?")) return;
          updateStatus(id, "Decline");
        };

    return (
                  <div className="grid-container-admin">
        <Sidebar activeMenu="Appointments" />
        <Header />

        <main className="main-container">
          <div className="admin-appointment-wrapper">
            <div className="top-row">
              <button className="back-btn" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
              </button>
              <div className="page-title">
                <h3>Appointments</h3>
                <h4>Manage customer appointments and scheduling</h4>
              </div>
            </div>

            <div className="controls-row">
              <div className="tabs-container">
                <button 
                  className={`tab-btn ${activeTab === "Pending" ? "active" : ""}`} 
                  onClick={() => setActiveTab("Pending")}
                >
                  <FaClock /> Pending ({pendingCount})
                </button>
                <button 
                  className={`tab-btn ${activeTab === "Accepted" ? "active" : ""}`} 
                  onClick={() => setActiveTab("Accepted")}
                >
                  <FaCheckCircle /> Accepted ({acceptedCount})
                </button>
              </div>

              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search service type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-message">Loading appointments...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="appointment-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Service Type</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length ? (
                      filtered.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.serviceType}</td>
                          <td>{item.date}</td>
                          <td>
                            <select
                              value={item.time}
                              onChange={(e) => updateTime(item.id, e.target.value)}
                              className="time-select"
                            >
                              {getAvailableTimes(item.serviceType).map(t => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td className="actions-td">
                            {item.status === "Pending" && (
                              <>
                                <button 
                                  className="accept-btn" 
                                  onClick={() => handleAccept(item.id)}
                                  disabled={isAccepting}
                                >
                                  {isAccepting ? 'Accepting...' : 'Accept'}
                                </button>
                                <button 
                                  className="decline-btn" 
                                  onClick={() => handleDecline(item.id)}
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="no-data">
                          No {activeTab} Appointments
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
  );
}