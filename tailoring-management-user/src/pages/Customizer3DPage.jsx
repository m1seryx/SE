import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Viewer3D from '../components/3d-customizer/Viewer3D';
import CustomizationPanel from '../components/3d-customizer/CustomizationPanel';
import '../styles/3d-App.css';
import './Customizer3DPage.css';

// Check if running inside React Native WebView
const isReactNativeWebView = () => {
  return typeof window !== 'undefined' && window.ReactNativeWebView !== undefined;
};

// Send message to React Native
const sendToReactNative = (data) => {
  if (isReactNativeWebView()) {
    window.ReactNativeWebView.postMessage(JSON.stringify(data));
    return true;
  }
  return false;
};

const Customizer3DPage = () => {
  const navigate = useNavigate();
  const [customizationData, setCustomizationData] = useState(null);
  const [garment, setGarment] = useState('coat-men');
  const [size, setSize] = useState('medium');
  const [fit, setFit] = useState('regular');
  const [modelSize, setModelSize] = useState('full');
  const [colors, setColors] = useState({
    fabric: '#3a5a72',
    lining: '#1e2a35',
    button: '#c8a66a',
    stitching: '#e1d6c7',
  });
  const [fabric, setFabric] = useState('wool');
  const [pattern, setPattern] = useState('none');
  const [measurements, setMeasurements] = useState({
    chest: 38,
    waist: 32,
    hips: 38,
    shoulders: 18,
    sleeveLength: 25,
    inseam: 30,
  });
  const [personalization, setPersonalization] = useState({
    initials: '',
    font: 'Serif',
    size: 0.8,
  });
  const [designImage, setDesignImage] = useState(null);
  const [notes, setNotes] = useState('');
  const [buttons, setButtons] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [pantsType, setPantsType] = useState('casual-men');
  const [isRNWebView, setIsRNWebView] = useState(false);
  const [rnAuthData, setRnAuthData] = useState(null);

  const fabrics = ['silk', 'linen', 'cotton', 'wool', 'jusi', 'Piña'];
  const patterns = ['none', 'minimal-stripe', 'minimal-check', 'embroidery-1', 'embroidery-2'];

  const coatStyle = { lapel: 'notch', buttons: 2, pocket: 'flap', vents: 'single' };
  const barongStyle = { collar: 'classic', sleeves: 'long', transparency: 0.35, embroidery: 'preset-a' };
  const suitStyle = { lapel: 'peak', buttons: 2, pocket: 'jetted', vents: 'double' };
  const pantsStyle = { fit: 'regular', pleats: 'none', cuffs: 'none' };

  const [style, setStyle] = useState(coatStyle);

  // Check for React Native WebView and listen for auth data
  useEffect(() => {
    // Check if we're in React Native WebView
    const checkRNWebView = () => {
      if (isReactNativeWebView() || window.IS_REACT_NATIVE_WEBVIEW) {
        setIsRNWebView(true);
        if (window.REACT_NATIVE_AUTH) {
          setRnAuthData(window.REACT_NATIVE_AUTH);
        }
      }
    };

    // Initial check
    checkRNWebView();

    // Listen for React Native ready event
    const handleRNReady = (event) => {
      setIsRNWebView(true);
      setRnAuthData(event.detail);
      console.log('React Native WebView detected, auth:', event.detail);
    };

    document.addEventListener('reactNativeReady', handleRNReady);

    // Also expose init function for RN to call
    window.initReactNativeMode = (authData) => {
      setIsRNWebView(true);
      setRnAuthData(authData);
      console.log('React Native mode initialized with auth:', authData);
    };

    return () => {
      document.removeEventListener('reactNativeReady', handleRNReady);
    };
  }, []);

  useEffect(() => {
    // Load customization data from sessionStorage
    const data = sessionStorage.getItem('customizationFormData');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setCustomizationData(parsed);
        console.log('Loaded customization data:', parsed);
      } catch (error) {
        console.error('Error parsing customization data:', error);
      }
    }

    // Load saved design from localStorage
    const saved = localStorage.getItem('tailorDesign');
    if (saved) {
      try {
        const v = JSON.parse(saved);
        if (v) {
          setGarment(v.garment || 'coat-men');
          setSize(v.size || 'medium');
          setFit(v.fit || 'regular');
          setModelSize(v.modelSize || 'full');
          setColors(v.colors || { fabric: '#3a5a72', lining: '#1e2a35', button: '#c8a66a', stitching: '#e1d6c7' });
          setFabric(v.fabric || 'wool');
          setPattern(v.pattern || 'none');
          setMeasurements(v.measurements || { chest: 38, waist: 32, hips: 38, shoulders: 18, sleeveLength: 25, inseam: 30 });
          setPersonalization(v.personalization || { initials: '', font: 'Serif', size: 0.8 });
          setDesignImage(v.designImage || null);
          setNotes(v.notes || '');
          setButtons(v.buttons || []);
          setAccessories(v.accessories || []);
          setPantsType(v.pantsType || 'casual-men');
        }
      } catch (error) {
        console.error('Error loading saved design:', error);
      }
    }
  }, []);

  useEffect(() => {
    const s = garment.startsWith('coat') ? coatStyle : garment === 'barong' ? barongStyle : garment.startsWith('suit') ? suitStyle : pantsStyle;
    setStyle(s);
  }, [garment]);

  const handleSaveDesign = async () => {
    const summary = {
      garment,
      size,
      fit,
      modelSize,
      colors,
      fabric,
      pattern,
      style,
      measurements,
      personalization,
      designImage,
      notes,
      buttons,
      accessories,
      pantsType,
      timestamp: new Date().toISOString(),
    };
    
    // Save to localStorage
    localStorage.setItem('tailorDesign', JSON.stringify(summary));
    
    // Capture the 3D canvas as PNG with design info and download
    try {
      // Find the WebGL canvas from the viewer
      const viewerElement = document.querySelector('.viewer');
      let sourceCanvas = viewerElement ? viewerElement.querySelector('canvas') : document.querySelector('canvas');
      
      if (sourceCanvas) {
        // Create a new canvas to combine the 3D image with design info
        const combinedCanvas = document.createElement('canvas');
        const ctx = combinedCanvas.getContext('2d');
        
        // Set dimensions - 3D image + info section below
        const infoHeight = 280;
        combinedCanvas.width = sourceCanvas.width;
        combinedCanvas.height = sourceCanvas.height + infoHeight;
        
        // Draw white background
        ctx.fillStyle = '#1a1f3a';
        ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
        
        // Draw the 3D canvas image
        ctx.drawImage(sourceCanvas, 0, 0);
        
        // Draw info section background
        ctx.fillStyle = '#0f1419';
        ctx.fillRect(0, sourceCanvas.height, combinedCanvas.width, infoHeight);
        
        // Add border line
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, sourceCanvas.height);
        ctx.lineTo(combinedCanvas.width, sourceCanvas.height);
        ctx.stroke();
        
        // Prepare design info text
        const garmentName = garment === 'coat-men' ? 'Blazer (Men)' : 
                          garment === 'coat-women' ? 'Blazer (Women)' :
                          garment === 'barong' ? 'Barong Tagalog' :
                          garment === 'suit-1' ? 'Business Suit' :
                          garment === 'pants' ? 'Pants' : garment;
        
        const buttonsList = buttons && buttons.length > 0 
          ? buttons.map(b => b.modelPath?.split('/').pop()?.replace('.glb', '') || 'Button').join(', ')
          : 'None';
        
        const accessoriesList = accessories && accessories.length > 0
          ? accessories.map(a => a.modelPath?.split('/').pop()?.replace('.glb', '').replace(' 3d model', '') || 'Accessory').join(', ')
          : 'None';
        
        // Draw title
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.fillText("D'JACKMAN TAILOR DELUXE - Custom Design", 20, sourceCanvas.height + 35);
        
        // Draw design info
        ctx.fillStyle = '#e7e9ee';
        ctx.font = '16px Arial, sans-serif';
        const lineHeight = 28;
        let y = sourceCanvas.height + 70;
        
        const infoLines = [
          `🎨 Garment Type: ${garmentName}`,
          `📏 Size: ${size.charAt(0).toUpperCase() + size.slice(1)} | Fit: ${fit.charAt(0).toUpperCase() + fit.slice(1)}`,
          `🧵 Fabric: ${fabric.charAt(0).toUpperCase() + fabric.slice(1)} | Pattern: ${pattern === 'none' ? 'Solid' : pattern}`,
          `🎨 Colors - Fabric: ${colors.fabric} | Lining: ${colors.lining} | Buttons: ${colors.button}`,
          `🔘 Buttons: ${buttonsList}`,
          `✨ Accessories: ${accessoriesList}`,
          `📝 Notes: ${notes || 'None'}`,
          `📅 Created: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
        ];
        
        infoLines.forEach(line => {
          ctx.fillText(line, 20, y);
          y += lineHeight;
        });
        
        // Download the combined image
        const dataUrl = combinedCanvas.toDataURL('image/png');
        
        // If in React Native WebView, send the image data instead of downloading
        if (isRNWebView) {
          // Send to React Native
          sendToReactNative({
            type: 'DESIGN_IMAGE_READY',
            imageData: dataUrl,
            garmentName: garmentName,
          });
          await alert('✓ Design image ready!', 'Success', 'success');
        } else {
          // Download for web
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `tailoring-design-${garmentName.replace(/[^a-z0-9]/gi, '-')}-${new Date().getTime()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          await alert('✓ Design image with details saved as PNG!', 'Success', 'success');
        }
      } else {
        await alert('Canvas not found. Design saved to localStorage only.', 'Warning', 'warning');
      }
    } catch (error) {
      console.error('Error saving design as PNG:', error);
      await alert('Error saving image. Design saved to localStorage.', 'Error', 'error');
    }
  };

  // Helper function to get garment type name
  const getGarmentTypeName = () => {
    if (garment === 'coat-men') return 'Blazer (Men)';
    if (garment === 'coat-women') return 'Blazer (Women)';
    if (garment === 'barong') return 'Barong Tagalog';
    if (garment === 'suit-1') return 'Business Suit';
    if (garment === 'pants') return 'Pants';
    return garment;
  };

  // Capture canvas as base64
  const captureCanvasImage = () => {
    try {
      const viewerElement = document.querySelector('.viewer');
      const sourceCanvas = viewerElement ? viewerElement.querySelector('canvas') : document.querySelector('canvas');
      if (sourceCanvas) {
        return sourceCanvas.toDataURL('image/png');
      }
    } catch (error) {
      console.error('Error capturing canvas:', error);
    }
    return null;
  };

  const handleApplyDesign = async () => {
    const garmentTypeName = getGarmentTypeName();
    
    // Calculate estimated price based on garment type
    const priceMap = {
      'Blazer (Men)': 2500,
      'Blazer (Women)': 2500,
      'Barong Tagalog': 3000,
      'Business Suit': 4000,
      'Pants': 1200,
    };
    const estimatedPrice = priceMap[garmentTypeName] || 2000;

    // Capture the canvas image
    const designImage = captureCanvasImage();

    const finalDesign = {
      ...customizationData,
      design: {
        garment,
        garmentType: garmentTypeName,
        size,
        fit,
        colors,
        fabric,
        pattern,
        measurements,
        personalization,
        notes,
        buttons,
        accessories,
        pantsType,
        designImage: designImage, // Include the captured image
      },
      timestamp: new Date().toISOString(),
    };
    
    // If in React Native WebView, send data back to app
    if (isRNWebView) {
      sendToReactNative({
        type: 'CUSTOMIZATION_COMPLETE',
        garmentType: garmentTypeName,
        fabricType: fabric,
        designImage: designImage,
        designData: finalDesign.design,
        notes: notes,
        estimatedPrice: estimatedPrice,
        measurements: measurements,
      });
      
      // Show confirmation
      await alert('✓ Design sent to app!', 'Success', 'success');
      return;
    }
    
    // Web behavior - save to sessionStorage
    sessionStorage.setItem('finalDesignData', JSON.stringify(finalDesign));
    
    // Navigate back to user home (modal will reopen automatically)
    navigate('/user-home');
  };

  const handleBackToCustomization = () => {
    // If in React Native WebView, send cancel message
    if (isRNWebView) {
      sendToReactNative({
        type: 'CUSTOMIZATION_CANCEL',
      });
      return;
    }

    // Navigate back to user home (modal will reopen if flag is set)
    navigate('/user-home');
  };

  return (
    <div className="app">
      <div className="nav">
        <button 
          className={garment.startsWith('coat') ? 'active' : ''} 
          onClick={() => setGarment('coat-men')}
        >
          Blazer
        </button>
        <button 
          className={garment === 'barong' ? 'active' : ''} 
          onClick={() => setGarment('barong')}
        >
          Barong
        </button>
        <button 
          className={garment.startsWith('suit') ? 'active' : ''} 
          onClick={() => setGarment('suit-1')}
        >
          Suit
        </button>
        <button 
          className={garment === 'pants' ? 'active' : ''} 
          onClick={() => setGarment('pants')}
        >
          Pants
        </button>
        <button 
          className="save-btn"
          onClick={handleSaveDesign}
          title="Save design to localStorage"
        >
          💾 Save
        </button>
        <button 
          className="apply-btn"
          onClick={handleApplyDesign}
          title="Apply design and return"
        >
          ✓ Apply
        </button>
        <button 
          className="back-btn"
          onClick={handleBackToCustomization}
          title="Go back"
        >
          ← Back
        </button>
      </div>

      <div className="panel">
        <CustomizationPanel
          garment={garment}
          setGarment={setGarment}
          size={size}
          setSize={setSize}
          fit={fit}
          setFit={setFit}
          modelSize={modelSize}
          setModelSize={setModelSize}
          colors={colors}
          setColors={setColors}
          fabric={fabric}
          setFabric={setFabric}
          patterns={patterns}
          pattern={pattern}
          setPattern={setPattern}
          fabrics={fabrics}
          designImage={designImage}
          setDesignImage={setDesignImage}
          notes={notes}
          setNotes={setNotes}
          buttons={buttons}
          setButtons={setButtons}
          accessories={accessories}
          setAccessories={setAccessories}
          pantsType={pantsType}
          setPantsType={setPantsType}
          style={style}
          setStyle={setStyle}
        />
      </div>

      <div className="viewer">
        <Viewer3D
          garment={garment}
          size={size}
          fit={fit}
          modelSize={modelSize}
          colors={colors}
          fabric={fabric}
          pattern={pattern}
          style={style}
          measurements={measurements}
          personalization={personalization}
          buttons={buttons}
          setButtons={setButtons}
          accessories={accessories}
          setAccessories={setAccessories}
          pantsType={pantsType}
        />
      </div>
    </div>
  );
};

export default Customizer3DPage;
