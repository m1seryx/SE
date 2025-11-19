console.log('Script loaded successfully!');

const mockAppointments = [
  {
    id: 1,
    name: "Maria Santos",
    serviceType: "Customization",
    date: "2024-11-20",
    time: "9:00 AM",
    status: "Pending",
    phone: "+63 912 345 6789",
    email: "maria.santos@email.com",
    notes: "Wedding suit fitting"
  },
  {
    id: 2,
    name: "Juan dela Cruz",
    serviceType: "Dry Cleaning",
    date: "2024-11-20",
    time: "10:30 AM",
    status: "Approved",
    phone: "+63 923 456 7890",
    email: "juan.delacruz@email.com",
    notes: "3 business suits"
  },
  {
    id: 3,
    name: "Sofia Reyes",
    serviceType: "Rental",
    date: "2024-11-21",
    time: "2:00 PM",
    status: "Pending",
    phone: "+63 934 567 8901",
    email: "sofia.reyes@email.com",
    notes: "Barong for corporate event"
  },
  {
    id: 4,
    name: "Carlos Mendoza",
    serviceType: "Repair",
    date: "2024-11-22",
    time: "11:00 AM",
    status: "Approved",
    phone: "+63 945 678 9012",
    email: "carlos.mendoza@email.com",
    notes: "Trouser hem adjustment"
  },
  {
    id: 5,
    name: "Isabella Garcia",
    serviceType: "Customization",
    date: "2024-11-23",
    time: "3:30 PM",
    status: "Pending",
    phone: "+63 956 789 0123",
    email: "isabella.garcia@email.com",
    notes: "Custom evening gown consultation"
  }
];

// Function to populate the table
function populateAppointmentsTable() {
  const tbody = document.getElementById('content');
  
  if (!tbody) {
    console.error('Table body element not found');
    return;
  }
  
  tbody.innerHTML = '';
  
  mockAppointments.forEach(appointment => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${appointment.name}</td>
      <td>${appointment.serviceType}</td>
      <td>${appointment.date}</td>
      <td>${appointment.time}</td>
      <td>
        <div class="buttons">
          <button class="accept-btn" onclick="handleAccept(${appointment.id})">Accept</button>
          <button class="decline-btn" onclick="handleDecline(${appointment.id})">Decline</button>
        </div>
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Handle accept action
function handleAccept(appointmentId) {
  const appointment = mockAppointments.find(apt => apt.id === appointmentId);
  if (appointment) {
    appointment.status = 'Approved';
    alert(`Appointment for ${appointment.name} has been approved!`);
    populateAppointmentsTable();
  }
}

// Handle decline action
function handleDecline(appointmentId) {
  const appointment = mockAppointments.find(apt => apt.id === appointmentId);
  if (appointment) {
    const confirmDecline = confirm(`Are you sure you want to decline the appointment for ${appointment.name}?`);
    if (confirmDecline) {
      appointment.status = 'Declined';
      alert(`Appointment for ${appointment.name} has been declined.`);
      populateAppointmentsTable();
    }
  }
}

// Initialize table when page loads
document.addEventListener('DOMContentLoaded', function() {
  populateAppointmentsTable();
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mockAppointments, populateAppointmentsTable };
}