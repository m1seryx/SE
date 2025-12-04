import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/RepairFormModal.css';
import { save2DCustomization, getAllCustomizationServices } from '../../api/CustomizationApi';

const Customization2DPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serviceId: '',
    serviceName: '2D Custom Design',
    base_price: '500',
    style_complexity: 'intermediate',
    estimated_time: '3-5 days',
    clothing_type: 'coat',
    variant_id: 'coat_trench',
    gender: 'unisex',
    fabric_type: 'cotton',
    pattern_type: 'solid',
    color_value: '#1a1a1a',
    clothing_fit: 'regular',
    ai_image_url: '',
    customization_prompt: '',
    customization_details: '',
    pickup_date: ''
  });
  
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState('');

  // Fetch available customization services
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const result = await getAllCustomizationServices();
      if (Array.isArray(result)) {
        setServices(result);
        // Set default service if available
        if (result.length > 0) {
          setFormData(prev => ({
            ...prev,
            serviceId: result[0].service_id,
            serviceName: result[0].service_name,
            base_price: result[0].base_price,
            style_complexity: result[0].style_complexity,
            estimated_time: result[0].estimated_time
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const service = services.find(s => s.service_id == serviceId);
    
    setFormData(prev => ({
      ...prev,
      serviceId: serviceId,
      serviceName: service ? service.service_name : prev.serviceName,
      base_price: service ? service.base_price : prev.base_price,
      style_complexity: service ? service.style_complexity : prev.style_complexity,
      estimated_time: service ? service.estimated_time : prev.estimated_time
    }));
  };

  // Convert hex color to descriptive color name
  const hexToColorName = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Common color mappings
    const colorMap = {
      '#1a1a1a': 'deep black',
      '#2b6cb0': 'navy blue',
      '#8b0000': 'dark red',
      '#228b22': 'forest green',
      '#4a4a4a': 'charcoal gray',
      '#d69e2e': 'golden yellow',
      '#f6e8c3': 'cream',
      '#000000': 'black',
      '#ffffff': 'white',
      '#ff0000': 'red',
      '#00ff00': 'green',
      '#0000ff': 'blue',
    };
    
    // Check if we have a direct mapping
    if (colorMap[`#${hex}`]) {
      return colorMap[`#${hex}`];
    }
    
    // Determine color based on RGB values
    if (brightness < 50) return 'black';
    if (brightness > 250) return 'white';
    
    // Determine dominant color
    if (r > g && r > b) {
      if (r > 200) return 'bright red';
      if (r > 150) return 'red';
      return 'dark red';
    }
    if (g > r && g > b) {
      if (g > 200) return 'bright green';
      if (g > 150) return 'green';
      return 'dark green';
    }
    if (b > r && b > g) {
      if (b > 200) return 'bright blue';
      if (b > 150) return 'blue';
      return 'dark blue';
    }
    if (r === g && g === b) {
      if (brightness > 200) return 'light gray';
      if (brightness > 100) return 'gray';
      return 'dark gray';
    }
    
    // Fallback to brightness-based description
    if (brightness > 200) return 'light colored';
    if (brightness > 100) return 'medium colored';
    return 'dark colored';
  };

  const buildPrompt = () => {
    const fabricTypes = {
      cotton: { name: "Cotton Twill", desc: "Soft & breathable" },
      silk: { name: "Silk Blend", desc: "Luxurious & smooth" },
      denim: { name: "Selvedge Denim", desc: "Durable & classic" },
      linen: { name: "Irish Linen", desc: "Light & natural" },
      wool: { name: "Wool Cashmere", desc: "Warm & premium" },
      piña: { name: "Piña Fiber", desc: "Sheer pineapple fiber" },
      jusi: { name: "Jusi Silk", desc: "Silky banana fiber" },
      organza: { name: "Organza", desc: "Crisp & translucent" },
    };

    const fabricInfo = fabricTypes[formData.fabric_type] || { name: formData.fabric_type, desc: "" };
    const basePrompt = `${formData.clothing_type} garment`;
    const patternDescriptor = formData.pattern_type === "solid" ? "smooth finish" : `${formData.pattern_type} pattern`;
    const fitDescriptor = formData.clothing_fit ? `${formData.clothing_fit} fit` : "";
    const genderDescriptor =
      formData.gender === "male"
        ? "menswear tailoring"
        : formData.gender === "female"
        ? "womenswear tailoring"
        : "unisex tailoring";
    const colorName = formData.color_value ? hexToColorName(formData.color_value) : "";
    const colorDescriptor = colorName ? `in ${colorName} color` : "";
    const fabricDescriptor = fabricInfo.desc
      ? `crafted from ${fabricInfo.name.toLowerCase()} (${fabricInfo.desc})`
      : `crafted from ${fabricInfo.name.toLowerCase()}`;
      
    return `Professional product photography of a ${formData.clothing_type} with ${fitDescriptor}, ${genderDescriptor}, ${basePrompt}, ${fabricDescriptor}, featuring ${patternDescriptor}, ${colorDescriptor}. Fabric texture must clearly show ${fabricInfo.name.toLowerCase()} qualities. Displayed on a mannequin or hanger, no person visible, clean studio background, focus on the garment details. ${formData.customization_details}`.trim();
  };

  const generateImage = async () => {
    const prompt = buildPrompt();
    setFormData(prev => ({ ...prev, customization_prompt: prompt }));
    setIsGenerating(true);
    setMessage('');
    
    // Try OpenAI DALL-E first, then fallback to faster free service
    const openAiKey = import.meta.env?.VITE_OPENAI_API_KEY;

    try {
      // Option 1: Use OpenAI DALL-E if API key is available (fastest, ~10-20 seconds)
      if (openAiKey) {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data[0] && data.data[0].url) {
            setAiImageUrl(data.data[0].url);
            setFormData(prev => ({ ...prev, ai_image_url: data.data[0].url }));
            setIsGenerating(false);
            return;
          }
        } else {
          // If OpenAI fails, fall through to free service
          console.warn("OpenAI DALL-E failed, using fallback service");
        }
      }

      // Option 2: Use free image generation service with timeout
      // Pollinations.ai can be slow, so we set a timeout and show the image URL immediately
      const timestamp = Date.now();
      const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&enhance=true&seed=${timestamp}`;
      
      console.log("Generating image with URL:", fallbackUrl);
      
      // Set the URL immediately - the image will load asynchronously
      setAiImageUrl(fallbackUrl);
      setFormData(prev => ({ ...prev, ai_image_url: fallbackUrl }));
      
      // Set a timeout to stop the loading state after 30 seconds
      // The image will still try to load, but we won't show "Generating..." forever
      const timeoutId = setTimeout(() => {
        setIsGenerating(false);
        setMessage("Image generation is taking longer than expected. The image may still appear when ready (can take 1-2 minutes). For faster generation, add an OpenAI API key to your .env file.");
      }, 30000);
      
      // Clear timeout if image loads successfully
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeoutId);
        setIsGenerating(false);
        setMessage("");
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        // Image will still try to load via the img tag's onError handler
      };
      img.src = fallbackUrl;
      
    } catch (err) {
      console.error("Image generation error:", err);
      setMessage(
        err.message || 
        "Image generation is taking too long or failed. Please try again or add an OpenAI API key (VITE_OPENAI_API_KEY) for faster, more reliable generation."
      );
      setAiImageUrl("");
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.serviceId || !formData.pickup_date) {
      setMessage('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const customizationData = {
        serviceId: formData.serviceId,
        serviceName: formData.serviceName,
        base_price: formData.base_price,
        style_complexity: formData.style_complexity,
        estimated_time: formData.estimated_time,
        clothing_type: formData.clothing_type,
        variant_id: formData.variant_id,
        gender: formData.gender,
        fabric_type: formData.fabric_type,
        pattern_type: formData.pattern_type,
        color_value: formData.color_value,
        clothing_fit: formData.clothing_fit,
        ai_image_url: formData.ai_image_url,
        customization_prompt: formData.customization_prompt,
        customization_details: formData.customization_details,
        pickup_date: formData.pickup_date
      };

      console.log('Saving 2D customization data:', customizationData);

      const result = await save2DCustomization(customizationData);
      
      if (result.success) {
        setMessage(`✅ 2D customization saved successfully! Service ID: ${result.serviceId}`);
        // Redirect back to home or cart
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage('❌ Failed to save 2D customization');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const clothingOptions = [
    { id: "coat", label: "Coats" },
    { id: "barong", label: "Barongs" },
    { id: "suit", label: "Suits" },
    { id: "pants", label: "Trousers" }
  ];

  const variantOptions = {
    coat: [
      { id: "coat_trench", name: "Modern Trench Coat" },
      { id: "coat_cocoon", name: "Cocoon Coat" },
      { id: "coat_overcoat", name: "Double-Breasted Overcoat" }
    ],
    barong: [
      { id: "barong_classic", name: "Classic Piña Barong" }
    ],
    suit: [
      { id: "suit_classic", name: "Classic Two-Piece" },
      { id: "suit_double", name: "Double-Breasted Suit" },
      { id: "suit_tux", name: "Evening Tuxedo" }
    ],
    pants: [
      { id: "pants_formal", name: "Formal Trousers" },
      { id: "pants_wide", name: "Wide-Leg Trousers" }
    ]
  };

  const fabricOptions = [
    { id: "cotton", name: "Cotton Twill", desc: "Soft & breathable" },
    { id: "silk", name: "Silk Blend", desc: "Luxurious & smooth" },
    { id: "denim", name: "Selvedge Denim", desc: "Durable & classic" },
    { id: "linen", name: "Irish Linen", desc: "Light & natural" },
    { id: "wool", name: "Wool Cashmere", desc: "Warm & premium" },
    { id: "piña", name: "Piña Fiber", desc: "Sheer pineapple fiber" },
    { id: "jusi", name: "Jusi Silk", desc: "Silky banana fiber" },
    { id: "organza", name: "Organza", desc: "Crisp & translucent" }
  ];

  const patternOptions = [
    "solid", "stripes", "checked", "floral"
  ];

  const colorOptions = [
    "#1a1a1a", "#2b6cb0", "#8b0000", "#228b22", 
    "#4a4a4a", "#d69e2e", "#f6e8c3"
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <h2>🎨 2D Customization Tool</h2>
          <button className="modal-close-btn" onClick={() => navigate(-1)}>×</button>
        </div>
        
        <div className="modal-body">
          {message && (
            <div className={`alert ${message.includes('✅') ? 'alert-success' : message.includes('❌') ? 'alert-error' : 'alert-info'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              {/* Service Selection */}
              <div className="form-group">
                <label htmlFor="serviceId">Customization Service *</label>
                <select
                  id="serviceId"
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleServiceChange}
                  required
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service.service_id} value={service.service_id}>
                      {service.service_name} - ₱{service.base_price}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Pickup Date */}
              <div className="form-group">
                <label htmlFor="pickup_date">Pickup Date *</label>
                <input
                  type="date"
                  id="pickup_date"
                  name="pickup_date"
                  value={formData.pickup_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            {/* Clothing Type */}
            <div className="form-group">
              <label>Clothing Type</label>
              <div className="button-group">
                {clothingOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    className={`model-btn ${formData.clothing_type === option.id ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, clothing_type: option.id }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Variant Selection */}
            <div className="form-group">
              <label>Style Variants</label>
              <div className="variant-grid">
                {variantOptions[formData.clothing_type]?.map(variant => (
                  <button
                    key={variant.id}
                    type="button"
                    className={`variant-card ${formData.variant_id === variant.id ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, variant_id: variant.id }))}
                  >
                    <div className="variant-name">{variant.name}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="form-row">
              {/* Gender */}
              <div className="form-group">
                <label>Gender</label>
                <div className="button-group">
                  {["male", "female", "unisex"].map(gender => (
                    <button
                      key={gender}
                      type="button"
                      className={`model-btn ${formData.gender === gender ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, gender }))}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Fit */}
              <div className="form-group">
                <label>Fit</label>
                <div className="button-group">
                  {["regular", "slim", "loose"].map(fit => (
                    <button
                      key={fit}
                      type="button"
                      className={`model-btn ${formData.clothing_fit === fit ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, clothing_fit: fit }))}
                    >
                      {fit.charAt(0).toUpperCase() + fit.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Color Picker */}
            <div className="form-group">
              <label>Color Palette</label>
              <div className="color-grid">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-swatch ${formData.color_value === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color_value: color }))}
                    title={color}
                  />
                ))}
              </div>
              <div className="custom-color-input">
                <input 
                  type="color" 
                  value={formData.color_value} 
                  onChange={(e) => setFormData(prev => ({ ...prev, color_value: e.target.value }))}
                />
                <span>Custom Color: {formData.color_value}</span>
              </div>
            </div>
            
            {/* Fabric Selection */}
            <div className="form-group">
              <label>Fabric Options</label>
              <div className="fabric-grid">
                {fabricOptions.map(fabric => (
                  <button
                    key={fabric.id}
                    type="button"
                    className={`fabric-card ${formData.fabric_type === fabric.id ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, fabric_type: fabric.id }))}
                  >
                    <div className="fabric-name">{fabric.name}</div>
                    <div className="fabric-desc">{fabric.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Pattern Selection */}
            <div className="form-group">
              <label>Pattern</label>
              <div className="pattern-grid">
                {patternOptions.map(pattern => (
                  <button
                    key={pattern}
                    type="button"
                    className={`pattern-btn ${formData.pattern_type === pattern ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, pattern_type: pattern }))}
                  >
                    {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Customization Details */}
            <div className="form-group">
              <label htmlFor="customization_details">Customization Details</label>
              <textarea
                id="customization_details"
                name="customization_details"
                value={formData.customization_details}
                onChange={handleInputChange}
                placeholder="Describe any special customization requirements..."
                rows={3}
              />
            </div>
            
            {/* AI Preview Section */}
            <div className="form-group">
              <label>AI Preview</label>
              <div className="ai-preview-box">
                {isGenerating ? (
                  <div className="preview-placeholder">
                    <span role="img" aria-label="sparkles">✨</span>
                    <p>Generating image... Please wait.</p>
                  </div>
                ) : aiImageUrl ? (
                  <img 
                    src={aiImageUrl} 
                    alt="AI generated garment preview" 
                    onError={(e) => {
                      console.error("Image failed to load:", aiImageUrl);
                      setMessage("Image failed to load. Please try generating again.");
                      setAiImageUrl("");
                    }}
                    onLoad={() => {
                      setMessage("");
                    }}
                  />
                ) : (
                  <div className="preview-placeholder">
                    <span role="img" aria-label="sparkles">✨</span>
                    <p>No AI image yet. Click "Generate Preview" to create one.</p>
                  </div>
                )}
              </div>
              <div className="preview-actions">
                <button 
                  type="button" 
                  className="btn-submit" 
                  onClick={generateImage} 
                  disabled={isGenerating}
                  style={{ backgroundColor: '#6A3C3E', borderColor: '#6A3C3E' }}
                >
                  {isGenerating ? "Generating..." : " Generate Preview"}
                </button>
              </div>
              {formData.customization_prompt && (
                <div className="prompt-chip">
                  <strong>Prompt:</strong> {formData.customization_prompt}
                </div>
              )}
            </div>
            
            {/* Submit Button */}
            <div className="form-group">
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : '✓ Confirm & Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Customization2DPage;