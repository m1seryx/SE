import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Stage } from '@react-three/drei';
import { useCallback, useEffect, Suspense, useState } from 'react';
import * as THREE from 'three';
import GarmentModel from './GarmentModel';
import DraggableButton from './DraggableButton';
import DraggableAccessory from './DraggableAccessory';

function ExportButton() {
  const { gl, scene, camera } = useThree();
  const onExport = useCallback(() => {
    gl.render(scene, camera);
    const url = gl.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'garment.png';
    a.click();
  }, [gl, scene, camera]);
  useEffect(() => {
    const handler = () => onExport();
    document.addEventListener('export-png', handler);
    return () => document.removeEventListener('export-png', handler);
  }, [onExport]);
  return null;
}

// Camera controller for capturing different angles
function CameraController() {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    const handleCaptureAngle = async (event) => {
      const { angle, callbackId } = event.detail;
      
      // Set camera position based on angle
      const distance = 5;
      const height = 1.6;
      const target = new THREE.Vector3(0, height, 0);
      
      let x = 0, z = distance;
      
      switch(angle) {
        case 'front':
          x = 0;
          z = distance;
          break;
        case 'back':
          x = 0;
          z = -distance;
          break;
        case 'right':
          x = distance;
          z = 0;
          break;
        case 'left':
          x = -distance;
          z = 0;
          break;
        default:
          x = 0;
          z = distance;
      }
      
      // Set camera position and look at target
      camera.position.set(x, height, z);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      
      // Wait for render to complete (multiple frames for stability)
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      });
      
      // Force render and capture
      gl.render(scene, camera);
      const imageData = gl.domElement.toDataURL('image/png');
      
      // Send the captured image back
      window.dispatchEvent(new CustomEvent('angle-captured', {
        detail: { angle, imageData, callbackId }
      }));
    };

    window.addEventListener('capture-angle', handleCaptureAngle);
    return () => window.removeEventListener('capture-angle', handleCaptureAngle);
  }, [camera, gl, scene]);

  return null;
}

export default function Viewer3D({ garment, size, fit, modelSize, colors, fabric, pattern, style, measurements, personalization, buttons, setButtons, accessories, setAccessories, pantsType, customModels = [] }) {
  const [selectedButton, setSelectedButton] = useState(null);
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const [isAnyButtonMoving, setIsAnyButtonMoving] = useState(false);
  const [isAnyAccessoryMoving, setIsAnyAccessoryMoving] = useState(false);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas 
        camera={{ position: [0, 1.6, 5], fov: 50 }} 
        shadows 
        dpr={[1, 2]} 
          gl={{ 
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.4, // Higher exposure to show dark colors better
            preserveDrawingBuffer: true  // Required for screenshot capture
          }}
      >
        <color attach="background" args={[1, 1, 1]} />
        <fog attach="fog" args={[0xffffff, 10, 30]} />
        <Stage intensity={0.6} adjustCamera={false} shadows="accumulative" environment={null}>
          <Suspense fallback={<mesh><boxGeometry args={[1, 2, 0.5]} /><meshStandardMaterial color="#cccccc" /></mesh>}>
            <GarmentModel garment={garment} size={size} fit={fit} modelSize={modelSize} colors={colors} fabric={fabric} pattern={pattern} style={style} measurements={measurements} personalization={personalization} pantsType={pantsType} customModels={customModels} />
          </Suspense>
        </Stage>
        {/* Enhanced lighting to show dark colors accurately */}
        <directionalLight position={[4, 6, -3]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-5, 3, 5]} intensity={0.5} color="#ffffff" />
        <directionalLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />
        <ambientLight intensity={0.6} />

        <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2.6} far={4.5} />
        <OrbitControls enablePan={false} enabled={!isAnyButtonMoving && !isAnyAccessoryMoving} />
        <CameraController />
        {buttons && buttons.map((btn) => (
          <DraggableButton
            key={btn.id}
            id={btn.id}
            modelPath={btn.modelPath}
            position={btn.position}
            color={btn.color}
            scale={btn.scale || 0.15}
            isSelected={selectedButton === btn.id}
            onSelect={setSelectedButton}
            onPositionChange={(id, newPos) => {
              setButtons((prev) => prev.map((b) => b.id === id ? { ...b, position: newPos } : b));
            }}
            onMovingChange={setIsAnyButtonMoving}
          />
        ))}
        {accessories && accessories.map((acc) => (
          <DraggableAccessory
            key={acc.id}
            id={acc.id}
            modelPath={acc.modelPath}
            position={acc.position}
            color={acc.color}
            scale={acc.scale || 0.2}
            isSelected={selectedAccessory === acc.id}
            onSelect={setSelectedAccessory}
            onPositionChange={(id, newPos) => {
              setAccessories((prev) => prev.map((a) => a.id === id ? { ...a, position: newPos } : a));
            }}
            onMovingChange={setIsAnyAccessoryMoving}
          />
        ))}
        <ExportButton />
      </Canvas>
    </div>
  );
}
