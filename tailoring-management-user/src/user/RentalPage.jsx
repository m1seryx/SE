import React from 'react';
import { useNavigate } from 'react-router-dom';
import RentalClothes from './components/RentalClothes';
import '../styles/RentalPage.css';

const RentalPage = () => {
  const navigate = useNavigate();
  
  const openAuthModal = () => {
    // For logged-in users, this would open the service modal
    // For guests, this would open the auth modal
    // This can be handled by the component itself or passed from parent
    console.log('Rental action triggered');
  };

  return (
    <div className="rental-page">
      <div className="rental-container">
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/user-home')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#8B4513',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#6d370f';
              e.target.style.transform = 'translateX(-3px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#8B4513';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            ← Home
          </button>
        </div>
        <RentalClothes openAuthModal={openAuthModal} showAll={true} />
      </div>
    </div>
  );
};

export default RentalPage;
