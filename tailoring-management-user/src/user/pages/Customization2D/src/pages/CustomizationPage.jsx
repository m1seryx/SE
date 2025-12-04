import React, { useEffect, useMemo, useState } from "react";
import "../styles/CustomizationPage.css";

export default function CustomizationPage({
  selectedClothing,
  catalog = [],
  fabricLibrary = {},
  colors = [],
  patterns = [],
  initialCustomization,
  onSave,
  onBack,
}) {
  const defaultCategoryId = selectedClothing || initialCustomization.clothingType || catalog[0]?.id;
  const [clothingType, setClothingType] = useState(defaultCategoryId);
  const [variantId, setVariantId] = useState(initialCustomization.variantId || "");
  const [gender, setGender] = useState(initialCustomization.gender || "unisex");
  const [fabricType, setFabricType] = useState(initialCustomization.fabricType);
  const [pattern, setPattern] = useState(initialCustomization.pattern);
  const [color, setColor] = useState(initialCustomization.color);
  const [clothingFit, setClothingFit] = useState(initialCustomization.clothingFit);
  const [customPrompt, setCustomPrompt] = useState(initialCustomization.customPrompt || "");
  const [generatedPrompt, setGeneratedPrompt] = useState(initialCustomization.generatedPrompt || "");
  const [aiImageUrl, setAiImageUrl] = useState(initialCustomization.aiImageUrl || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const activeCategory = useMemo(
    () => catalog.find((item) => item.id === clothingType) || catalog[0],
    [catalog, clothingType]
  );

  const variants = activeCategory?.variants || [];
  const activeVariant =
    variants.find((variant) => variant.id === variantId) || variants[0] || null;

  useEffect(() => {
    if (!variants.length) return;
    if (!variantId || !variants.some((variant) => variant.id === variantId)) {
      setVariantId(variants[0].id);
      setColor(variants[0].defaultColor || color);
      if (variants[0].fabrics?.length) {
        setFabricType(variants[0].fabrics[0]);
      }
    }
  }, [clothingType, variants, variantId, color]);

  useEffect(() => {
    if (activeVariant?.fabrics?.length && !activeVariant.fabrics.includes(fabricType)) {
      setFabricType(activeVariant.fabrics[0]);
    }
  }, [activeVariant, fabricType]);

  const handleVariantSelect = (variant) => {
    setVariantId(variant.id);
    if (variant.defaultColor) {
      setColor(variant.defaultColor);
    }
    if (variant.fabrics?.length) {
      setFabricType(variant.fabrics[0]);
    }
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
    const fabricName = fabricLibrary[fabricType]?.name || fabricType;
    const fabricDesc = fabricLibrary[fabricType]?.desc || "";
    const basePrompt = activeVariant?.prompt || `${activeCategory?.label} garment`;
    const patternDescriptor = pattern === "solid" ? "smooth finish" : `${pattern} pattern`;
    const fitDescriptor = clothingFit ? `${clothingFit} fit` : "";
    const genderDescriptor =
      gender === "male"
        ? "menswear tailoring"
        : gender === "female"
        ? "womenswear tailoring"
        : "unisex tailoring";
    const colorName = color ? hexToColorName(color) : "";
    const colorDescriptor = colorName ? `in ${colorName} color` : "";
    const fabricDescriptor = fabricDesc
      ? `crafted from ${fabricName.toLowerCase()} (${fabricDesc})`
      : `crafted from ${fabricName.toLowerCase()}`;
    return `Professional product photography of a ${activeVariant?.name || activeCategory?.label} with ${fitDescriptor}, ${genderDescriptor}, ${basePrompt}, ${fabricDescriptor}, featuring ${patternDescriptor}, ${colorDescriptor}. Fabric texture must clearly show ${fabricName.toLowerCase()} qualities. Displayed on a mannequin or hanger, no person visible, clean studio background, focus on the garment details. ${customPrompt}`.trim();
  };

  const generateImage = async () => {
    const prompt = buildPrompt();
    setGeneratedPrompt(prompt);
    setIsGenerating(true);
    setError("");
    
    // Try OpenAI DALL-E first, then fallback to faster free service
    const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;

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
      
      // Set a timeout to stop the loading state after 30 seconds
      // The image will still try to load, but we won't show "Generating..." forever
      const timeoutId = setTimeout(() => {
        setIsGenerating(false);
        setError("Image generation is taking longer than expected. The image may still appear when ready (can take 1-2 minutes). For faster generation, add an OpenAI API key to your .env file.");
      }, 30000);
      
      // Clear timeout if image loads successfully
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeoutId);
        setIsGenerating(false);
        setError("");
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        // Image will still try to load via the img tag's onError handler
      };
      img.src = fallbackUrl;
      
    } catch (err) {
      console.error("Image generation error:", err);
      setError(
        err.message || 
        "Image generation is taking too long or failed. Please try again or add an OpenAI API key (VITE_OPENAI_API_KEY) for faster, more reliable generation."
      );
      setAiImageUrl("");
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!aiImageUrl) return;
    const link = document.createElement("a");
    link.href = aiImageUrl;
    link.download = `${activeVariant?.id || clothingType}-preview.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = () => {
    onSave({
      clothingType,
      variantId: activeVariant?.id,
      gender,
      fabricType,
      pattern,
      color,
      clothingFit,
      customPrompt,
      generatedPrompt,
      aiImageUrl,
    });
  };

  const fabricsForVariant = (activeVariant?.fabrics || []).map((fabricId) => fabricLibrary[fabricId]).filter(Boolean);

  return (
    <div className="customization-page">
      <div className="customization-container">
        {/* Preview Panel */}
        <div className="preview-panel">
          <div className="preview-header">
            <h2>AI Photo Preview</h2>
            <p>Generate a photorealistic sample powered by AI image generation.</p>
          </div>
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
                  setError("Image failed to load. Please try generating again.");
                  setAiImageUrl("");
                }}
                onLoad={() => {
                  setError("");
                }}
              />
            ) : (
              <div className="preview-placeholder">
                <span role="img" aria-label="sparkles">✨</span>
                <p>No AI image yet. Select options then hit "Generate Preview".</p>
              </div>
            )}
          </div>
          <div className="preview-actions">
            <button className="generate-btn" onClick={generateImage} disabled={isGenerating}>
              {isGenerating ? "Generating..." : " Generate Preview"}
            </button>
            <button className="download-btn" onClick={handleDownloadImage} disabled={!aiImageUrl}>
               Download Image
            </button>
          </div>
          {generatedPrompt && (
            <div className="prompt-chip">
              <strong>Prompt:</strong> {generatedPrompt}
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
        </div>

        {/* Controls Panel */}
        <div className="controls-panel-custom">
          <h2>Design your {activeVariant?.name || activeCategory?.label}</h2>

          {/* Clothing Categories */}
          <div className="control-section">
            <label className="control-label">Category</label>
            <div className="button-group">
              {catalog.map((cat) => (
                <button
                  key={cat.id}
                  className={`model-btn ${clothingType === cat.id ? "active" : ""}`}
                  onClick={() => setClothingType(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variant Selection (hidden when only one variant, e.g., Barong) */}
          {variants.length > 1 && (
            <div className="control-section">
              <label className="control-label">Style Variants</label>
              <div className="variant-grid">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={`variant-card ${variantId === variant.id ? "active" : ""}`}
                    onClick={() => handleVariantSelect(variant)}
                  >
                    <div className="variant-name">{variant.name}</div>
                    <div className="variant-detail">{variant.detail}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clothing Fit */}
          <div className="control-section">
            <label className="control-label">Fit</label>
            <div className="button-group">
              {["regular", "slim", "loose"].map((fit) => (
                <button
                  key={fit}
                  className={`model-btn ${clothingFit === fit ? "active" : ""}`}
                  onClick={() => setClothingFit(fit)}
                >
                  {fit.charAt(0).toUpperCase() + fit.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="control-section">
            <label className="control-label">Gender</label>
            <div className="button-group">
              {["male", "female", "unisex"].map((g) => (
                <button
                  key={g}
                  className={`model-btn ${gender === g ? "active" : ""}`}
                  onClick={() => setGender(g)}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="control-section">
            <label className="control-label">Color Palette</label>
            <div className="color-grid">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? "active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
            <div className="custom-color-input">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              <span>Custom Color: {color}</span>
            </div>
          </div>

          {/* Fabric Selection */}
          <div className="control-section">
            <label className="control-label">Fabric Options</label>
            <div className="fabric-grid">
              {fabricsForVariant.map((fabric) => (
                <button
                  key={fabric.id}
                  className={`fabric-card ${fabricType === fabric.id ? "active" : ""}`}
                  onClick={() => setFabricType(fabric.id)}
                >
                  <div className="fabric-name">{fabric.name}</div>
                  <div className="fabric-desc">{fabric.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pattern Selection */}
          <div className="control-section">
            <label className="control-label">Pattern</label>
            <div className="pattern-grid">
              {patterns.map((p) => (
                <button
                  key={p}
                  className={`pattern-btn ${pattern === p ? "active" : ""}`}
                  onClick={() => setPattern(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Design Prompt */}
          <div className="control-section">
            <label className="control-label">Unique Design Notes</label>
            <textarea
              className="prompt-textarea"
              placeholder="Describe special embroidery, accessories, setting, etc."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            />
            <small className="helper-text">
              Your inputs + selected options become the AI prompt to render the preview.
            </small>
          </div>

          
          <div className="action-buttons">
            {typeof onBack === "function" && (
              <button className="btn-back" onClick={onBack}>
                ← Back
              </button>
            )}
            <button className="btn-next" onClick={handleSave}>
              Continue to Review →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
