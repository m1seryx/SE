import { RoundedBox, Capsule, Text, Edges, useGLTF } from '@react-three/drei';
import { useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';

function makePattern(type, base, accent) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  if (type === 'minimal-stripe') {
    ctx.fillStyle = accent;
    for (let i = 0; i < 256; i += 12) { ctx.fillRect(i, 0, 2, 256); }
  } else if (type === 'minimal-check') {
    ctx.strokeStyle = accent; ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 14) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke(); }
  } else if (type === 'embroidery-1') {
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const x = 20 + i * 20; ctx.beginPath(); ctx.arc(128, x, 16, 0, Math.PI * 2); ctx.stroke(); }
  } else if (type === 'embroidery-2') {
    ctx.fillStyle = accent;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(32 + i * 24, 40); ctx.lineTo(48 + i * 24, 56); ctx.lineTo(16 + i * 24, 56); ctx.closePath(); ctx.fill(); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makeBump() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      const n = (Math.sin(x * 0.15) + Math.cos(y * 0.13)) * 0.5 + Math.random() * 0.05;
      const v = Math.floor(128 + 20 * n);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export default function GarmentModel({ garment, size, fit, modelSize, colors, fabric, pattern, style, measurements, personalization, pantsType }) {
  const baseColor = colors.fabric;
  const accent = colors.stitching;
  const map = useMemo(() => makePattern(pattern, baseColor, accent), [pattern, baseColor, accent]);
  const bump = useMemo(() => makeBump(), []);
  const fabricColor = useMemo(() => {
    const color = new THREE.Color(baseColor);
    // Calculate perceived brightness (luminance)
    const brightness = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b);
    
    // For dark colors, brighten them more aggressively to show true color without appearing too dark
    if (brightness < 0.5) {
      // More aggressive brightening for very dark colors
      // For very dark colors (brightness < 0.2), brighten significantly
      // For medium-dark colors (0.2-0.5), brighten moderately
      let brightenFactor;
      if (brightness < 0.2) {
        // Very dark colors: brighten by 60-80%
        brightenFactor = 1.0 + (0.2 - brightness) * 2.0 + 0.6; // 1.6 to 2.0
      } else {
        // Medium-dark colors: brighten by 30-50%
        brightenFactor = 1.0 + (0.5 - brightness) * 0.67; // 1.0 to 1.2
      }
      
      // Preserve the hue while brightening
      const maxComponent = Math.max(color.r, color.g, color.b);
      if (maxComponent > 0) {
        // Normalize to preserve hue, then brighten
        const normalizedR = color.r / maxComponent;
        const normalizedG = color.g / maxComponent;
        const normalizedB = color.b / maxComponent;
        
        // Brighten while maintaining relative color ratios
        const targetBrightness = Math.min(0.6, brightness * brightenFactor);
        const scale = targetBrightness / (0.299 * normalizedR + 0.587 * normalizedG + 0.114 * normalizedB);
        
        color.r = Math.min(1.0, normalizedR * scale);
        color.g = Math.min(1.0, normalizedG * scale);
        color.b = Math.min(1.0, normalizedB * scale);
      }
    }
    return color;
  }, [baseColor]);
  
  const materialProps = useMemo(() => {
    // Fabric-specific properties
    let rough, metal, bumpScale;
    if (fabric === 'silk') {
      rough = 0.25;
      metal = 0.1;
      bumpScale = 0.02;
    } else if (fabric === 'linen') {
      rough = 0.85;
      metal = 0.0;
      bumpScale = 0.08;
    } else if (fabric === 'cotton') {
      rough = 0.6;
      metal = 0.0;
      bumpScale = 0.06;
    } else if (fabric === 'jusi') {
      // Jusi fabric - smooth, slightly shiny, semi-transparent
      rough = 0.3;
      metal = 0.05;
      bumpScale = 0.03;
    } else if (fabric === 'Piña' || fabric === 'pina') {
      // Piña fabric - very smooth, slightly more transparent than jusi
      rough = 0.25;
      metal = 0.08;
      bumpScale = 0.02;
    } else {
      // Default (wool)
      rough = 0.9;
      metal = 0.0;
      bumpScale = 0.07;
    }
    
    const transparent = garment === 'barong';
    const opacity = garment === 'barong' ? Math.max(0.15, Math.min(0.85, style.transparency || 0.35)) : 1;
    
    // Calculate brightness for sheen adjustment
    const brightness = (0.299 * fabricColor.r + 0.587 * fabricColor.g + 0.114 * fabricColor.b);
    // Reduce sheen more for darker colors to prevent high contrast
    const adjustedSheen = brightness < 0.3 ? 0.2 : brightness < 0.5 ? 0.4 : 1.0;
    
    return { 
      roughness: rough, 
      metalness: metal, 
      map, 
      color: fabricColor, 
      transparent, 
      opacity, 
      sheen: adjustedSheen, 
      sheenColor: fabricColor, 
      bumpMap: bump, 
      bumpScale 
    };
  }, [fabric, fabricColor, map, garment, style, bump]);

  const chestS = measurements.chest / 38;
  const waistS = measurements.waist / 32;
  const hipsS = measurements.hips / 38;
  const shoulderS = measurements.shoulders / 18;
  const sleeveS = measurements.sleeveLength / 25;
  const inseamS = measurements.inseam / 30;

  const buttonColor = new THREE.Color(colors.button);
  const liningColor = new THREE.Color(colors.lining);

  // Load all 3D models unconditionally (hooks must be called at top level)
  // Full-size models
  const blackBlazer = useGLTF('/black blazer 3d model.glb');
  const blackBlazerPlain = useGLTF('/black blazer plain 3d model.glb');
  const blazerWomen = useGLTF('/blazer 3d model.glb');
  const blazerWomenPlain = useGLTF('/blazer 3d women plain model.glb');
  const tealCoat = useGLTF('/teal long coat 3d model.glb');
  const barongModel = useGLTF('/barong tagalog shirt 3d model.glb');
  const suit1 = useGLTF('/business suit 3d model.glb');
  const suit2 = useGLTF('/business suit 3d model (1).glb');
  const pantsCasualMen = useGLTF('/pants 3d model.glb');
  const pantsFormalMen = useGLTF('/dress pants 3d model.glb');
  const pantsFormalWomen = useGLTF('/denim jeans 3d model.glb');

  // Short models from public/short3d folder
  const blackBlazerShort = useGLTF('/short3d/blazer short model.glb');
  const blackBlazerPlainShort = useGLTF('/short3d/blazer short plain M model.glb');
  const blazerWomenShort = useGLTF('/short3d/blazer W short model.glb');
  const blazerWomenPlainShort = useGLTF('/short3d/blazer woman short plain model.glb');
  const tealCoatShort = useGLTF('/short3d/trench coat 3d  short model.glb');

  // Determine which model to use based on garment type and modelSize
  let selectedModel = null;
  let use3DModel = false;

  if (garment === 'coat-men') {
    use3DModel = true;
    selectedModel = modelSize === 'short' ? blackBlazerShort.scene : blackBlazer.scene;
  } else if (garment === 'coat-men-plain') {
    use3DModel = true;
    selectedModel = modelSize === 'short' ? blackBlazerPlainShort.scene : blackBlazerPlain.scene;
  } else if (garment === 'coat-women') {
    use3DModel = true;
    selectedModel = modelSize === 'short' ? blazerWomenShort.scene : blazerWomen.scene;
  } else if (garment === 'coat-women-plain') {
    use3DModel = true;
    selectedModel = modelSize === 'short' ? blazerWomenPlainShort.scene : blazerWomenPlain.scene;
  } else if (garment === 'coat-teal') {
    use3DModel = true;
    selectedModel = modelSize === 'short' ? tealCoatShort.scene : tealCoat.scene;
  } else if (garment === 'barong') {
    use3DModel = true;
    selectedModel = barongModel.scene;
  } else if (garment === 'suit-1') {
    use3DModel = true;
    selectedModel = suit1.scene;
  } else if (garment === 'suit-2') {
    use3DModel = true;
    selectedModel = suit2.scene;
  }

  const modelScene = useMemo(() => selectedModel ? selectedModel.clone() : null, [selectedModel]);

  // Calculate scale based on size and fit selection
  const sizeScale = useMemo(() => {
    let baseScale;
    switch (size) {
      case 'small':
        baseScale = 1.4; // Smaller scale
        break;
      case 'large':
        baseScale = 1.6; // Larger scale
        break;
      case 'medium':
      default:
        baseScale = 1.5; // Default scale
        break;
    }

    // Adjust scale based on fit
    switch (fit) {
      case 'loose':
        return baseScale * 1.05; // 5% larger for loose fit
      case 'fitted':
        return baseScale * 0.95; // 5% smaller for fitted fit
      case 'regular':
      default:
        return baseScale; // No adjustment for regular fit
    }
  }, [size, fit]);

  useLayoutEffect(() => {
    if (use3DModel && modelScene) {
      // Rotate model to face forward (toward camera)
      modelScene.rotation.y = -Math.PI / 2; // -90 degrees

      modelScene.traverse((child) => {
        if (child.isMesh) {
          // Dispose of old material to prevent memory leaks
          if (child.material && child.material.dispose) {
            child.material.dispose();
          }
          // Create new material with updated color
          const newMaterial = new THREE.MeshPhysicalMaterial({
            ...materialProps,
            color: fabricColor.clone(),
            sheenColor: fabricColor.clone()
          });
          child.material = newMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [modelScene, garment, materialProps, use3DModel, fabricColor]);

  // Pants model selection and setup (hooks must be at top level)
  let pantsModel = null;
  if (garment === 'pants') {
    if (pantsType === 'casual-men') {
      pantsModel = pantsCasualMen.scene;
    } else if (pantsType === 'formal-men') {
      pantsModel = pantsFormalMen.scene;
    } else if (pantsType === 'formal-women') {
      pantsModel = pantsFormalWomen.scene;
    }
  }

  const pantsModelScene = useMemo(() => pantsModel ? pantsModel.clone() : null, [pantsModel]);

  useLayoutEffect(() => {
    if (pantsModelScene) {
      // Rotate model to face forward (toward camera)
      pantsModelScene.rotation.y = -Math.PI / 2; // -90 degrees

      pantsModelScene.traverse((child) => {
        if (child.isMesh) {
          // Dispose of old material to prevent memory leaks
          if (child.material && child.material.dispose) {
            child.material.dispose();
          }
          // Create new material with updated color
          const newMaterial = new THREE.MeshPhysicalMaterial({
            ...materialProps,
            color: fabricColor.clone(),
            sheenColor: fabricColor.clone()
          });
          child.material = newMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [pantsModelScene, materialProps, fabricColor]);

  if (garment === 'pants') {
    if (!pantsModelScene) return null;

    return (
      <group position={[0, 0, 0]} scale={sizeScale}>
        <primitive object={pantsModelScene} />
        {personalization.initials && (
          <Text position={[0, 1.5, 0.3]} fontSize={personalization.size * 0.25} color={colors.stitching}>
            {personalization.initials}
          </Text>
        )}
      </group>
    );
  }

  const isCoat = garment.startsWith('coat') || garment === 'suit';
  const lapel = isCoat ? style.lapel : 'shawl';
  const buttons = isCoat ? style.buttons : 0;
  const torsoH = garment.startsWith('coat') ? 3.0 * waistS : 2.4 * waistS;



  if (garment.startsWith('coat')) {
    if (!modelScene) return null;
    return (
      <group position={[0, 0, 0]} scale={sizeScale}>
        <primitive object={modelScene} />
        {/* Default buttons removed - use 3D Buttons panel to add custom buttons */}
        {personalization.initials && (
          <Text position={[0, 1.5, 0.3]} fontSize={personalization.size * 0.25} color={colors.stitching}>
            {personalization.initials}
          </Text>
        )}
      </group>
    );
  }

  // Render Barong with 3D model
  if (garment === 'barong') {
    if (!modelScene) return null;
    return (
      <group position={[0, 0, 0]} scale={sizeScale}>
        <primitive object={modelScene} />
        {personalization.initials && (
          <Text position={[0, 1.5, 0.3]} fontSize={personalization.size * 0.25} color={colors.stitching}>
            {personalization.initials}
          </Text>
        )}
      </group>
    );
  }

  // Render Suit with 3D model
  if (garment.startsWith('suit')) {
    if (!modelScene) return null;
    return (
      <group position={[0, 0, 0]} scale={sizeScale}>
        <primitive object={modelScene} />
        {/* Default buttons removed - use 3D Buttons panel to add custom buttons */}
        {personalization.initials && (
          <Text position={[0, 1.5, 0.3]} fontSize={personalization.size * 0.25} color={colors.stitching}>
            {personalization.initials}
          </Text>
        )}
      </group>
    );
  }

  return (
    <group>
      <RoundedBox args={[1.05 * chestS, torsoH, 0.4]} radius={0.2} smoothness={8} position={[-0.52 * chestS, 1.2, 0]}>
        <meshPhysicalMaterial {...materialProps} />
        <Edges scale={1} threshold={12} color={colors.lining} />
      </RoundedBox>
      <RoundedBox args={[1.05 * chestS, torsoH, 0.4]} radius={0.2} smoothness={8} position={[0.52 * chestS, 1.2, 0]}>
        <meshPhysicalMaterial {...materialProps} />
        <Edges scale={1} threshold={12} color={colors.lining} />
      </RoundedBox>
      <mesh position={[0, 1.55, 0.38]}>
        <boxGeometry args={[1.4 * chestS, 0.22, 0.06]} />
        <meshPhysicalMaterial color={liningColor} roughness={0.7} metalness={0.05} sheen={0.6} />
      </mesh>
      <Capsule args={[0.35 * shoulderS, 1.4 * sleeveS, 8, 16]} position={[-1.2 * shoulderS, 1.2, 0]} rotation={[0, 0, Math.PI / 16]}>
        <meshPhysicalMaterial color={liningColor} roughness={0.9} opacity={materialProps.opacity} transparent={materialProps.transparent} sheen={0.4} />
        <Edges scale={1} threshold={12} color={colors.stitching} />
      </Capsule>
      <Capsule args={[0.35 * shoulderS, 1.4 * sleeveS, 8, 16]} position={[1.2 * shoulderS, 1.2, 0]} rotation={[0, 0, -Math.PI / 16]}>
        <meshPhysicalMaterial color={liningColor} roughness={0.9} opacity={materialProps.opacity} transparent={materialProps.transparent} sheen={0.4} />
        <Edges scale={1} threshold={12} color={colors.stitching} />
      </Capsule>
      {isCoat && Array.from({ length: buttons }).map((_, i) => (
        <mesh key={`L${i}`} position={[-0.2, 1.1 - i * 0.25, 0.42]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshPhysicalMaterial color={buttonColor} metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
      {isCoat && Array.from({ length: buttons }).map((_, i) => (
        <mesh key={`R${i}`} position={[0.2, 1.1 - i * 0.25, 0.42]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshPhysicalMaterial color={buttonColor} metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
      {garment === 'barong' && style.embroidery && (
        <mesh position={[0, 1.2, 0.41]}>
          <planeGeometry args={[1.2 * chestS, 1.6 * waistS]} />
          <meshPhysicalMaterial map={makePattern('embroidery-1', '#00000000', accent)} transparent />
        </mesh>
      )}
      {personalization.initials && (
        <Text position={[-0.5 * chestS + 0.2, 1.3, 0.41]} fontSize={personalization.size * 0.25} color={colors.stitching}>
          {personalization.initials}
        </Text>
      )}
      {lapel === 'peak' && (
        <mesh position={[0, 1.6, 0.41]}>
          <boxGeometry args={[1.2 * chestS, 0.1, 0.02]} />
          <meshPhysicalMaterial color={colors.lining} />
        </mesh>
      )}
      {lapel === 'shawl' && (
        <mesh position={[0, 1.6, 0.41]}>
          <torusGeometry args={[0.7 * chestS, 0.06, 16, 64, Math.PI]} />
          <meshPhysicalMaterial color={colors.lining} />
        </mesh>
      )}
      {isCoat && (
        <>
          <mesh position={[-0.25 * chestS, 1.45, 0.41]} rotation={[0, 0, Math.PI / 14]}>
            <boxGeometry args={[0.5 * chestS, 0.18, 0.02]} />
            <meshPhysicalMaterial color={colors.lining} roughness={0.6} />
          </mesh>
          <mesh position={[0.25 * chestS, 1.45, 0.41]} rotation={[0, 0, -Math.PI / 14]}>
            <boxGeometry args={[0.5 * chestS, 0.18, 0.02]} />
            <meshPhysicalMaterial color={colors.lining} roughness={0.6} />
          </mesh>
        </>
      )}
      {isCoat && (style.pocket !== 'none') && (
        <>
          <mesh position={[-0.45 * chestS, 0.7, 0.41]}>
            <boxGeometry args={[0.38, 0.12, 0.02]} />
            <meshPhysicalMaterial color={colors.lining} roughness={0.8} />
          </mesh>
          <mesh position={[0.45 * chestS, 0.7, 0.41]}>
            <boxGeometry args={[0.38, 0.12, 0.02]} />
            <meshPhysicalMaterial color={colors.lining} roughness={0.8} />
          </mesh>
        </>
      )}
      {garment.startsWith('coat') && style.vents !== 'none' && (
        <mesh position={[0, 0.6, -0.39]}>
          <boxGeometry args={[0.04, 0.8, 0.01]} />
          <meshPhysicalMaterial color={colors.stitching} roughness={0.8} />
        </mesh>
      )}
      {isCoat && (
        <>
          <mesh position={[-1.2 * shoulderS, 0.5, 0]}>
            <boxGeometry args={[0.24, 0.06, 0.12]} />
            <meshPhysicalMaterial color={colors.lining} roughness={0.7} />
          </mesh>
          <mesh position={[1.2 * shoulderS, 0.5, 0]}>
            <boxGeometry args={[0.24, 0.06, 0.12]} />
            <meshPhysicalMaterial color={colors.lining} roughness={0.7} />
          </mesh>
        </>
      )}
      {garment === 'barong' && (
        <>
          <mesh position={[0, 1.58, 0.41]}>
            <boxGeometry args={[0.9 * chestS, 0.06, 0.02]} />
            <meshPhysicalMaterial color={liningColor} roughness={0.7} opacity={materialProps.opacity} transparent={materialProps.transparent} />
          </mesh>
          <mesh position={[0, 1.35, 0.42]}>
            <boxGeometry args={[0.18, 1.2, 0.02]} />
            <meshPhysicalMaterial color={liningColor} roughness={0.7} opacity={materialProps.opacity} transparent={materialProps.transparent} />
          </mesh>
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={`B${i}`} position={[0, 1.5 - i * 0.22, 0.43]}>
              <sphereGeometry args={[0.035, 16, 16]} />
              <meshPhysicalMaterial color={buttonColor} roughness={0.5} />
            </mesh>
          ))}
          {style.collar === 'mandarin' && (
            <mesh position={[0, 1.62, 0.38]}>
              <torusGeometry args={[0.36 * shoulderS, 0.035, 16, 64]} />
              <meshPhysicalMaterial color={liningColor} roughness={0.6} opacity={materialProps.opacity} transparent />
            </mesh>
          )}
          {style.collar === 'classic' && (
            <>
              <mesh position={[-0.22, 1.62, 0.41]} rotation={[0, 0, Math.PI / 9]}>
                <boxGeometry args={[0.36, 0.1, 0.02]} />
                <meshPhysicalMaterial color={liningColor} roughness={0.6} opacity={materialProps.opacity} transparent />
              </mesh>
              <mesh position={[0.22, 1.62, 0.41]} rotation={[0, 0, -Math.PI / 9]}>
                <boxGeometry args={[0.36, 0.1, 0.02]} />
                <meshPhysicalMaterial color={liningColor} roughness={0.6} opacity={materialProps.opacity} transparent />
              </mesh>
            </>
          )}
        </>
      )}
      {garment === 'suit' && (
        <>
          <mesh position={[0, 1.35, 0.43]}>
            <coneGeometry args={[0.12, 0.32, 24]} />
            <meshPhysicalMaterial color={colors.button} roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[-0.18, 1.55, 0.41]} rotation={[0, 0, Math.PI / 8]}>
            <boxGeometry args={[0.35, 0.1, 0.02]} />
            <meshPhysicalMaterial color={liningColor} />
          </mesh>
          <mesh position={[0.18, 1.55, 0.41]} rotation={[0, 0, -Math.PI / 8]}>
            <boxGeometry args={[0.35, 0.1, 0.02]} />
            <meshPhysicalMaterial color={liningColor} />
          </mesh>
          <Capsule args={[0.38 * hipsS, 1.35 * inseamS, 8, 16]} position={[-0.42 * hipsS, 0.7 * inseamS, 0]}>
            <meshPhysicalMaterial {...materialProps} />
            <Edges scale={1} threshold={15} color={colors.lining} />
          </Capsule>
          <Capsule args={[0.38 * hipsS, 1.35 * inseamS, 8, 16]} position={[0.42 * hipsS, 0.7 * inseamS, 0]}>
            <meshPhysicalMaterial {...materialProps} />
            <Edges scale={1} threshold={15} color={colors.lining} />
          </Capsule>
        </>
      )}
    </group>
  );
}

// Preload full-size models
useGLTF.preload('/teal long coat 3d model.glb');
useGLTF.preload('/black blazer 3d model.glb');
useGLTF.preload('/black blazer plain 3d model.glb');
useGLTF.preload('/blazer 3d model.glb');
useGLTF.preload('/blazer 3d women plain model.glb');
useGLTF.preload('/barong tagalog shirt 3d model.glb');
useGLTF.preload('/business suit 3d model.glb');
useGLTF.preload('/business suit 3d model (1).glb');
useGLTF.preload('/pants 3d model.glb');
useGLTF.preload('/dress pants 3d model.glb');
useGLTF.preload('/denim jeans 3d model.glb');

// Preload short models
useGLTF.preload('/short3d/blazer short model.glb');
useGLTF.preload('/short3d/blazer short plain M model.glb');
useGLTF.preload('/short3d/blazer W short model.glb');
useGLTF.preload('/short3d/blazer woman short plain model.glb');
useGLTF.preload('/short3d/trench coat 3d  short model.glb');

