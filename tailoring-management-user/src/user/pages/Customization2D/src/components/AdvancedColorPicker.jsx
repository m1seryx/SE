import React, { useState, useRef, useEffect } from 'react';
import "../components/AdvanceColorPicker.css";

const AdvancedColorPicker = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hue, setHue] = useState(210);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [hexValue, setHexValue] = useState(color);
  const pickerRef = useRef(null);

  // Convert hex to HSL
  const hexToHsl = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  // Convert HSL to hex
  const hslToHex = (h, s, l) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  useEffect(() => {
    const [h, s, l] = hexToHsl(color);
    setHue(h);
    setSaturation(s);
    setLightness(l);
    setHexValue(color);
  }, [color]);

  const handleHueChange = (e) => {
    const newHue = parseInt(e.target.value);
    setHue(newHue);
    const newColor = hslToHex(newHue, saturation, lightness);
    setHexValue(newColor);
    onChange(newColor);
  };

  const handleSaturationLightnessChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newSaturation = Math.round((x / rect.width) * 100);
    const newLightness = Math.round(100 - (y / rect.height) * 100);
    setSaturation(newSaturation);
    setLightness(newLightness);
    const newColor = hslToHex(hue, newSaturation, newLightness);
    setHexValue(newColor);
    onChange(newColor);
  };

  const handleHexChange = (e) => {
    const value = e.target.value;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
      setHexValue(value);
      if (value.length === 7) {
        const [h, s, l] = hexToHsl(value);
        setHue(h);
        setSaturation(s);
        setLightness(l);
        onChange(value);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentColor = hslToHex(hue, saturation, lightness);
  const gradientColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div className="advanced-color-picker-container" ref={pickerRef}>
      <button
        className="color-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: currentColor }}
      >
        <span className="color-preview" style={{ backgroundColor: currentColor }}></span>
        <span className="color-value">{hexValue.toUpperCase()}</span>
        <svg className="picker-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2L10.5 6H5.5L8 2Z" fill="currentColor" />
          <path d="M2 14L4.5 10H11.5L14 14H2Z" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div className="color-picker-dropdown">
          <div className="picker-header">
            <h4>Color Picker</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="picker-content">
            {/* Saturation/Lightness Area */}
            <div
              className="saturation-lightness-area"
              style={{ backgroundColor: gradientColor }}
              onMouseDown={(e) => {
                handleSaturationLightnessChange(e);
                const moveHandler = (e2) => handleSaturationLightnessChange(e2);
                const upHandler = () => {
                  document.removeEventListener('mousemove', moveHandler);
                  document.removeEventListener('mouseup', upHandler);
                };
                document.addEventListener('mousemove', moveHandler);
                document.addEventListener('mouseup', upHandler);
              }}
            >
              <div
                className="color-indicator"
                style={{
                  left: `${saturation}%`,
                  top: `${100 - lightness}%`,
                  backgroundColor: currentColor
                }}
              />
            </div>

            {/* Hue Slider */}
            <div className="hue-slider-container">
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={handleHueChange}
                className="hue-slider"
              />
            </div>

            {/* Hex Input */}
            <div className="hex-input-container">
              <label>Hex:</label>
              <input
                type="text"
                value={hexValue}
                onChange={handleHexChange}
                className="hex-input"
                placeholder="#000000"
              />
            </div>

            {/* RGB Display */}
            <div className="rgb-display">
              <div className="rgb-item">
                <label>R:</label>
                <span>{parseInt(currentColor.slice(1, 3), 16)}</span>
              </div>
              <div className="rgb-item">
                <label>G:</label>
                <span>{parseInt(currentColor.slice(3, 5), 16)}</span>
              </div>
              <div className="rgb-item">
                <label>B:</label>
                <span>{parseInt(currentColor.slice(5, 7), 16)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedColorPicker;


