import React from 'react';
import RentalClothes from './components/RentalClothes';
import '../styles/RentalPage.css';

const RentalPage = () => {
  const openAuthModal = () => {
    // For logged-in users, this would open the service modal
    // For guests, this would open the auth modal
    // This can be handled by the component itself or passed from parent
    console.log('Rental action triggered');
  };

  return (
    <div className="rental-page">
      <div className="rental-container">
        <RentalClothes openAuthModal={openAuthModal} showAll={true} />
      </div>
    </div>
  );
};

export default RentalPage;
