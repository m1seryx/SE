import React from "react";
import "../styles/ShopPage.css";

export default function ShopPage({ clothingTypes, onSelect }) {
  return (
    <div className="shop-page">
      <section className="shop-hero">
        <h2>Djacksman tailor</h2>
        <p>Choose your preferred clothing type to customize</p>
      </section>

      <div className="clothing-catalog">
        {clothingTypes.map((clothing) => (
          <div key={clothing.id} className="clothing-card">
            <div className="card-image">
              <span className="clothing-emoji">{clothing.image}</span>
            </div>
            <div className="card-content">
              <h3>{clothing.label}</h3>
              <p>{clothing.desc}</p>
              <button
                className="card-btn"
                onClick={() => onSelect(clothing.id)}
              >
                Customize Now
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="shop-info">
        <div className="info-card">
          <h4>100% Authentic</h4>
          <p>Genuine fabrics and real tailoring craftsmanship</p>
        </div>
        <div className="info-card">
          <h4>Expert Design</h4>
          <p>Professional tailors with years of experience</p>
        </div>
        <div className="info-card">
          <h4>Custom Fit</h4>
          <p>Tailored perfectly to your measurements</p>
        </div>
      </section>
    </div>
  );
}
