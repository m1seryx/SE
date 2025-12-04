import React, { useEffect, useState } from "react";
import coatSVG from "../assets/coat.svg.svg";
import pantsSVG from "../assets/pants.svg";
import suitsSVG from "../assets/suits.svg";
import barongSVG from "../assets/barong.svg";

// Utility to produce a darker shade for gradient stops
const darkenHex = (hex, amount = 0.15) => {
  if (!hex) return hex;
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.round(r * (1 - amount))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 - amount))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 - amount))));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
};

const defaultExternalByType = {
  coat: coatSVG,
  suit: suitsSVG,
  pants: pantsSVG,
  barong: barongSVG,
};

export default function SvgClothing({ type = "coat", color, pattern = "solid", width = "100%", height = "100%", externalSvgUrl = null, design = "none", designColor = null }) {
  const resolvedColor = (() => {
    if (color) return color;
    if (typeof window !== "undefined") {
      try {
        const cs = getComputedStyle(document.documentElement);
        const v = cs.getPropertyValue("--c-ink") || "";
        return v.trim() || "#1a1a1a";
      } catch (e) {
        return "#1a1a1a";
      }
    }
    return "#1a1a1a";
  })();

  const darker = darkenHex(resolvedColor, 0.22);
  const darkest = darkenHex(resolvedColor, 0.35);
  const lighter = darkenHex(resolvedColor, -0.15);

  const patternDefs = (
    <defs>
      <filter id="f_drop" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.18" />
      </filter>

      <filter id="f_highlight" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
      </filter>

      <linearGradient id="grad_main" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor={lighter} stopOpacity="0.92" />
        <stop offset="50%" stopColor={resolvedColor} stopOpacity="0.98" />
        <stop offset="100%" stopColor={darker} stopOpacity="0.98" />
      </linearGradient>

      <linearGradient id="grad_sleeve" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor={darker} stopOpacity="0.96" />
        <stop offset="100%" stopColor={darkest} stopOpacity="0.98" />
      </linearGradient>

      <pattern id="p_stripes" patternUnits="userSpaceOnUse" width="12" height="12">
        <rect width="12" height="12" fill="transparent" />
        <path d="M0 0 L12 0" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      </pattern>

      <pattern id="p_checked" patternUnits="userSpaceOnUse" width="16" height="16">
        <rect width="16" height="16" fill="transparent" />
        <path d="M0 0 L0 16" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
        <path d="M8 0 L8 16" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
        <path d="M0 0 L16 0" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
        <path d="M0 8 L16 8" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
      </pattern>

      <pattern id="p_floral" patternUnits="userSpaceOnUse" width="35" height="35">
        <rect width="35" height="35" fill="transparent" />
        <circle cx="8" cy="8" r="2.5" fill="rgba(255,255,255,0.1)" />
        <circle cx="27" cy="27" r="2.5" fill="rgba(255,255,255,0.1)" />
        <circle cx="17.5" cy="17.5" r="1.8" fill="rgba(255,255,255,0.06)" />
      </pattern>
    </defs>
  );

  const patternFill = pattern === "stripes" ? "url(#p_stripes)" : pattern === "checked" ? "url(#p_checked)" : pattern === "floral" ? "url(#p_floral)" : "none";

  // Support loading an external SVG (for example a detailed coat/suit/pants SVG file)
  const [externalSvg, setExternalSvg] = useState(null);
  const [externalSvgModified, setExternalSvgModified] = useState(null);

  // preferExternal: prefer the provided externalSvgUrl prop, otherwise default to local SVGs when available per clothing type
  const preferExternal = externalSvgUrl || defaultExternalByType[type] || null;

  useEffect(() => {
    if (!preferExternal) {
      setExternalSvg(null);
      return;
    }
    let canceled = false;
    // clear previous markup so we don't momentarily display the wrong garment asset
    setExternalSvg(null);
    fetch(preferExternal)
      .then((res) => res.text())
      .then((text) => {
        if (!canceled) setExternalSvg(text);
      })
      .catch(() => {
        if (!canceled) setExternalSvg(null);
      });
    return () => {
      canceled = true;
    };
  }, [preferExternal]);

 
  useEffect(() => {
    if (!externalSvg) {
      setExternalSvgModified(null);
      return;
    }
    if (typeof window === "undefined") {
      setExternalSvgModified(externalSvg);
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(externalSvg, "image/svg+xml");
      const svgNode = doc.querySelector("svg") || doc.documentElement;
      
      // Apply color more intelligently - prioritize paths and shapes, preserve transparent/none fills
      const elems = svgNode.querySelectorAll("path, rect, circle, ellipse, polygon");
      elems.forEach((el) => {
        try {
          const currentFill = el.getAttribute("fill");
          // Only apply color if fill is not transparent/none/undefined or is black/default
          if (!currentFill || currentFill === "none" || currentFill === "transparent" || currentFill === "#000000" || currentFill === "#000") {
            el.setAttribute("fill", resolvedColor);
          } else if (currentFill && currentFill !== "none" && currentFill !== "transparent") {
            // If it has a color, apply the resolved color
            el.setAttribute("fill", resolvedColor);
          }
          // Apply stroke only if element doesn't have stroke="none"
          const currentStroke = el.getAttribute("stroke");
          if (currentStroke !== "none" && darkest) {
            if (!currentStroke || currentStroke === "#000000" || currentStroke === "#000") {
              el.setAttribute("stroke", darkest);
            } else {
              el.setAttribute("stroke", darkest);
            }
          }
        } catch (e) {}
      });
      
      // Also handle groups that might contain styled elements
      const groups = svgNode.querySelectorAll("g");
      groups.forEach((g) => {
        try {
          const gFill = g.getAttribute("fill");
          if (gFill && gFill !== "none" && gFill !== "transparent") {
            g.setAttribute("fill", resolvedColor);
          }
        } catch (e) {}
      });

      // Attempt to auto-center items inside our 400x700 viewport
      const viewBoxAttr = svgNode.getAttribute("viewBox");
      let vbWidth = 400;
      let vbHeight = 700;
      if (viewBoxAttr) {
        const parts = viewBoxAttr.split(/[\s,]+/).map((v) => parseFloat(v));
        if (parts.length === 4) {
          vbWidth = parts[2] || vbWidth;
          vbHeight = parts[3] || vbHeight;
        }
      } else {
        vbWidth = parseFloat(svgNode.getAttribute("width")) || vbWidth;
        vbHeight = parseFloat(svgNode.getAttribute("height")) || vbHeight;
      }
      const safeWidth = vbWidth || 400;
      const safeHeight = vbHeight || 700;
      const scale = Math.min(400 / safeWidth, 700 / safeHeight);
      const tx = (400 - safeWidth * scale) / 2;
      const ty = (700 - safeHeight * scale) / 2;
      const fmt = (num) => {
        if (!Number.isFinite(num)) return "0";
        const fixed = num.toFixed(3);
        return fixed.replace(/\.?0+$/, "") || "0";
      };

      const centeredMarkup = `<g transform="translate(${fmt(tx)} ${fmt(ty)}) scale(${fmt(scale)})">${svgNode.innerHTML}</g>`;
      setExternalSvgModified(centeredMarkup);
    } catch (e) {
      // if parsing fails, fall back to raw markup
      setExternalSvgModified(externalSvg);
    }
  }, [externalSvg, resolvedColor, darkest]);

  // Much more realistic shapes that actually look like distinct clothing items
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 700"
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={type}
      style={{ display: "block", margin: "auto", maxWidth: "100%", maxHeight: "100%" }}
    >
      {patternDefs}

      {/* soft background */}
      <rect x="0" y="0" width="400" height="700" rx="12" fill="var(--c-soft)" />

      {/* ===== COAT ===== - Long, structured, with wide lapels */}
      {type === "coat" && (
        <g filter="url(#f_drop)" id="coat-group">
          {externalSvg ? (
            // Inline external SVG markup when available (fetched above). Use the
            // modified version (with fills/strokes adjusted) when available so
            // re-renders don't overwrite colorization.
            // Wrap in a centered group to ensure the inlined SVG is centered
            <g dangerouslySetInnerHTML={{ __html: externalSvgModified || externalSvg }} />
          ) : (
            <>
              {/* Main coat body - structured shape */}
              <path d="M 80 180 L 120 140 Q 200 100 280 140 L 320 180 L 340 380 L 320 600 Q 300 640 200 650 Q 100 640 80 600 L 60 380 Z" 
                fill="url(#grad_main)" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
              
              {/* Large left lapel - wide and shaped */}
              <path d="M 140 160 Q 130 200 140 350 L 170 380 Q 160 300 160 200 Z" 
                fill={darker} stroke="var(--c-ink)" strokeWidth="1" />
              
              {/* Large right lapel - wide and shaped */}
              <path d="M 260 160 Q 270 200 260 350 L 230 380 Q 240 300 240 200 Z" 
                fill={darker} stroke="var(--c-ink)" strokeWidth="1" />
              
              {/* Center button line */}
              <line x1="200" y1="160" x2="200" y2="500" stroke="rgba(50,45,41,0.06)" strokeWidth="2" />
              
              {/* Coat buttons - large and prominent */}
              <g fill="var(--c-ink)" stroke="rgba(0,0,0,0.6)" strokeWidth="1">
                <circle cx="200" cy="220" r="6" />
                <circle cx="200" cy="300" r="6" />
                <circle cx="200" cy="380" r="6" />
                <circle cx="200" cy="460" r="6" />
              </g>
              
              {/* Left sleeve - fitted */}
              <path d="M 120 170 Q 40 160 30 280 Q 35 380 130 400 L 140 200" 
                fill="url(#grad_sleeve)" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
              
              {/* Right sleeve - fitted */}
              <path d="M 280 170 Q 360 160 370 280 Q 365 380 270 400 L 260 200" 
                fill="url(#grad_sleeve)" stroke="var(--c-ink)" strokeWidth="2" strokeLinejoin="round" />
              
              {pattern !== "solid" && <rect x="75" y="130" width="250" height="520" fill={patternFill} opacity="0.95" rx="3" />}
            </>
          )}
        </g>
      )}

      {/* ===== BARONG ===== - Light, flowing, with embroidery */}
      {type === "barong" && (
        <g filter="url(#f_drop)" id="barong-group">
          {externalSvg ? (
            <g dangerouslySetInnerHTML={{ __html: externalSvgModified || externalSvg }} />
          ) : (
            <>
              {/* Barong body - tall and elegant */}
              <path d="M 90 170 Q 110 130 200 120 Q 290 130 310 170 L 330 360 Q 330 380 310 600 L 90 600 Q 70 380 70 360 Z" 
                    fill="url(#grad_main)" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round" />
              
              {/* Barong front panels - vertical split */}
              <path d="M 190 170 L 185 450 L 185 600" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="3" />
              <path d="M 210 170 L 215 450 L 215 600" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="3" />
              
              {/* Embroidery details - decorative lines */}
              <g stroke="rgba(200,160,0,0.4)" strokeWidth="1.2" fill="none" strokeLinecap="round">
                <path d="M 140 200 Q 200 220 260 200" />
                <path d="M 130 260 Q 200 290 270 260" />
                <path d="M 140 320 Q 200 350 260 320" />
                <path d="M 150 380 Q 200 400 250 380" />
              </g>
              
              {/* Gold buttons - mother of pearl style */}
              <g fill="#D4AF37" stroke="#A68500" strokeWidth="0.8">
                <circle cx="200" cy="210" r="4.5" />
                <circle cx="200" cy="290" r="4.5" />
                <circle cx="200" cy="370" r="4.5" />
                <circle cx="200" cy="450" r="4.5" />
              </g>
              
              {/* Left sleeve - tapered barong sleeves */}
              <path d="M 110 190 Q 50 175 40 300 Q 45 380 120 410 L 140 220" 
                    fill="url(#grad_sleeve)" stroke="#1a1a1a" strokeWidth="1.1" strokeLinejoin="round" />
              
              {/* Right sleeve - tapered barong sleeves */}
              <path d="M 290 190 Q 350 175 360 300 Q 355 380 280 410 L 260 220" 
                    fill="url(#grad_sleeve)" stroke="#1a1a1a" strokeWidth="1.1" strokeLinejoin="round" />
              
              {/* Barong collar detail */}
              <ellipse cx="200" cy="140" rx="60" ry="25" fill="none" stroke="rgba(200,160,0,0.2)" strokeWidth="1.5" />
              
              {pattern !== "solid" && <rect x="85" y="135" width="230" height="470" fill={patternFill} opacity="0.92" rx="3" />}
            </>
          )}
        </g>
      )}

      {/* ===== T-SHIRT ===== - Casual, short sleeves */}
      {type === "tshirt" && (
        <g filter="url(#f_drop)" id="tshirt-group">
          {/* T-shirt body - simple, casual */}
          <path d="M 70 200 Q 90 160 200 150 Q 310 160 330 200 L 340 380 L 300 400 L 280 220 L 120 220 L 100 400 L 60 380 Z" 
                fill="url(#grad_main)" stroke="#1a1a1a" strokeWidth="1" strokeLinejoin="round" />
          
          {/* Neckline - round crew neck */}
          <ellipse cx="200" cy="165" rx="45" ry="22" fill="rgba(0,0,0,0.02)" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
          
          {/* Left sleeve - short and relaxed */}
          <path d="M 100 210 Q 50 195 40 270 Q 45 310 100 320 L 110 230" 
                fill="url(#grad_sleeve)" stroke="#1a1a1a" strokeWidth="0.9" strokeLinejoin="round" />
          
          {/* Right sleeve - short and relaxed */}
          <path d="M 300 210 Q 350 195 360 270 Q 355 310 300 320 L 290 230" 
                fill="url(#grad_sleeve)" stroke="#1a1a1a" strokeWidth="0.9" strokeLinejoin="round" />
          
          {/* Sleeve cuffs - subtle */}
          <path d="M 45 268 Q 50 275 100 280" stroke="rgba(0,0,0,0.05)" strokeWidth="1.5" fill="none" />
          <path d="M 355 268 Q 350 275 300 280" stroke="rgba(0,0,0,0.05)" strokeWidth="1.5" fill="none" />
          
          {/* Hem */}
          <path d="M 60 395 L 340 395" stroke="rgba(0,0,0,0.06)" strokeWidth="2" />
          
          {pattern !== "solid" && <rect x="65" y="160" width="270" height="250" fill={patternFill} opacity="0.93" rx="2" />}
        </g>
      )}

      {/* ===== SUIT ===== - Formal jacket with pants */}
      {type === "suit" && (
        <g filter="url(#f_drop)" id="suit-group" transform="translate(0,-30)">
          {externalSvg ? (
            <g dangerouslySetInnerHTML={{ __html: externalSvgModified || externalSvg }} />
          ) : (
            <>
              {/* Suit jacket - structured and formal */}
              <path d="M 85 175 Q 105 130 200 115 Q 295 130 315 175 L 335 350 Q 335 370 320 480 L 80 480 Q 65 370 65 350 Z" 
                    fill="url(#grad_main)" stroke="#1a1a1a" strokeWidth="1.8" strokeLinejoin="round" />
              
              {/* Jacket lapels - formal pointed lapels */}
              <path d="M 155 185 L 135 340 L 170 360" fill={darker} stroke="#0a0a0a" strokeWidth="0.8" strokeLinejoin="round" />
              <path d="M 245 185 L 265 340 L 230 360" fill={darker} stroke="#0a0a0a" strokeWidth="0.8" strokeLinejoin="round" />
              
              {/* Jacket center line with buttons */}
              <line x1="200" y1="175" x2="200" y2="420" stroke="rgba(0,0,0,0.04)" strokeWidth="2" />
              
              {/* Formal buttons */}
              <g fill="#222" stroke="#0a0a0a" strokeWidth="1">
                <circle cx="200" cy="225" r="5.5" />
                <circle cx="200" cy="310" r="5.5" />
                <circle cx="200" cy="395" r="5.5" />
              </g>
              
              {/* Tie - red silk tie */}
              <path d="M 200 185 L 195 270 Q 195 295 200 325 Q 205 295 205 270 Z" 
                    fill="#8B0000" stroke="#5a0000" strokeWidth="0.8" />
              
              {/* Jacket left sleeve */}
              <path d="M 105 205 Q 30 190 25 310 Q 30 380 120 410" 
                    fill="url(#grad_sleeve)" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Jacket right sleeve */}
              <path d="M 295 205 Q 370 190 375 310 Q 370 380 280 410" 
                    fill="url(#grad_sleeve)" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Left pant leg */}
              <path d="M 130 475 Q 120 520 115 650 L 165 650 Q 170 520 160 475 Z" 
                    fill={darker} stroke="#0a0a0a" strokeWidth="1.2" strokeLinejoin="round" />
              
              {/* Right pant leg */}
              <path d="M 240 475 Q 230 520 235 650 L 285 650 Q 280 520 270 475 Z" 
                    fill={darker} stroke="#0a0a0a" strokeWidth="1.2" strokeLinejoin="round" />
              
              {/* Pant creases */}
              <line x1="145" y1="475" x2="140" y2="650" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
              <line x1="260" y1="475" x2="260" y2="650" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
              
              {pattern !== "solid" && <rect x="80" y="130" width="240" height="330" fill={patternFill} opacity="0.94" rx="2" />}
            </>
          )}
        </g>
      )}

      {/* ===== PANTS ===== - Two separate legs with proper fit */}
      {type === "pants" && (
        <g filter="url(#f_drop)" id="pants-group">
          {externalSvg ? (
            <g dangerouslySetInnerHTML={{ __html: externalSvgModified || externalSvg }} />
          ) : (
            <>
              {/* Waistband */}
              <ellipse cx="200" cy="160" rx="80" ry="20" fill={darkest} stroke="#0a0a0a" strokeWidth="1.4" />
              
              {/* Belt loops */}
              <g fill="rgba(0,0,0,0.08)" stroke="none">
                <rect x="125" y="145" width="8" height="35" rx="3" />
                <rect x="267" y="145" width="8" height="35" rx="3" />
              </g>
              
              {/* Zipper fly */}
              <g stroke="#777" strokeWidth="1.3" fill="none">
                <line x1="200" y1="160" x2="200" y2="230" />
                <circle cx="200" cy="165" r="3.5" fill="#555" stroke="#333" strokeWidth="0.6" />
              </g>
              
              {/* Left pant leg - distinct shape */}
              <path d="M 135 180 Q 130 300 120 650 L 180 650 Q 190 300 175 180 Z" 
                    fill="url(#grad_main)" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round" />
              
              {/* Right pant leg - distinct shape */}
              <path d="M 225 180 Q 210 300 220 650 L 280 650 Q 290 300 265 180 Z" 
                    fill="url(#grad_main)" stroke="#1a1a1a" strokeWidth="1.3" strokeLinejoin="round" />
              
              {/* Center seam left leg */}
              <path d="M 140 180 Q 135 300 125 650" stroke="rgba(0,0,0,0.1)" strokeWidth="0.9" fill="none" />
              
              {/* Center seam right leg */}
              <path d="M 260 180 Q 265 300 275 650" stroke="rgba(0,0,0,0.1)" strokeWidth="0.9" fill="none" />
              
              {/* Side seams - darker shade */}
              <path d="M 135 180 Q 125 300 120 650" stroke="rgba(0,0,0,0.12)" strokeWidth="0.7" fill="none" />
              <path d="M 265 180 Q 275 300 280 650" stroke="rgba(0,0,0,0.12)" strokeWidth="0.7" fill="none" />
              
              {/* Hem line */}
              <line x1="120" y1="645" x2="280" y2="645" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />
              
              {pattern !== "solid" && <g>
                <rect x="130" y="180" width="60" height="465" fill={patternFill} opacity="0.93" rx="2" />
                <rect x="220" y="180" width="60" height="465" fill={patternFill} opacity="0.93" rx="2" />
              </g>}
            </>
          )}
        </g>
      )}

      {/* ===== Design overlay (e.g. star/logo/dot) - rendered on top and not affected by color picker */}
      {design && design !== "none" && (
        <g id="design-overlay" transform="translate(200,260)" pointerEvents="none">
          {design === "star" && (
            <g>
              <polygon points="0,-24 6,-6 24,-6 9,4 14,22 0,11 -14,22 -9,4 -24,-6 -6,-6" fill={designColor || "#ffffff"} stroke="#000" strokeWidth="1.5" />
            </g>
          )}

          {design === "logo" && (
            <g>
              <text x="-12" y="8" fontSize="28" fill={designColor || "#ffffff"} stroke="#000" strokeWidth="0.8" fontWeight="700">R</text>
            </g>
          )}

          {design === "dot" && (
            <g>
              <circle cx="0" cy="0" r="12" fill={designColor || "#FFD700"} stroke="#000" strokeWidth="1" />
            </g>
          )}
        </g>
      )}

    </svg>
  );
}
