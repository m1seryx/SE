import { useGLTF } from '@react-three/drei';
import { useMemo, useLayoutEffect, Suspense } from 'react';
import * as THREE from 'three';

// Component to load a custom GLB model
// useGLTF uses Suspense internally, so we need to handle it properly
function CustomModelContent({ modelUrl, materialProps, fabricColor, onLoad, map, pattern }) {
  // useGLTF must be called unconditionally at the top level
  // It will throw a promise if loading, which Suspense will catch
  const { scene } = useGLTF(modelUrl);
  
  // Include pattern and map in dependencies to force re-clone when pattern changes
  const clonedScene = useMemo(() => {
    if (scene) {
      const cloned = scene.clone();
      console.log('Custom model scene cloned successfully, pattern:', pattern);
      return cloned;
    }
    return null;
  }, [scene, pattern, map]);

  useLayoutEffect(() => {
    if (clonedScene) {
      console.log('Applying materials to custom model, pattern:', pattern, 'hasMap:', !!map);
      // Apply material updates
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          if (child.material && child.material.dispose) {
            child.material.dispose();
          }
          if (materialProps && fabricColor) {
            const newMaterial = new THREE.MeshPhysicalMaterial({
              ...materialProps,
              color: fabricColor.clone(),
              sheenColor: fabricColor.clone(),
              map: map, // Explicitly pass the map texture
              needsUpdate: true
            });
            newMaterial.needsUpdate = true;
            child.material = newMaterial;
          }
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      // Rotate model to face forward
      clonedScene.rotation.y = -Math.PI / 2;
      if (onLoad) {
        onLoad(clonedScene);
      }
    }
  }, [clonedScene, onLoad, materialProps, fabricColor, map, pattern]);

  if (!clonedScene) {
    return null;
  }

  return <primitive object={clonedScene} />;
}

// Loading fallback
function ModelLoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
}

// Error fallback
function ModelErrorFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
  );
}

// Main component with Suspense
export default function CustomModelLoader({ modelUrl, onLoad, materialProps, fabricColor, map, pattern }) {
  if (!modelUrl) {
    console.warn('CustomModelLoader: No model URL provided');
    return <ModelErrorFallback />;
  }

  console.log('CustomModelLoader loading model from:', modelUrl, 'pattern:', pattern);

  return (
    <Suspense fallback={<ModelLoadingFallback />}>
      <CustomModelContent 
        modelUrl={modelUrl}
        materialProps={materialProps}
        fabricColor={fabricColor}
        onLoad={onLoad}
        map={map}
        pattern={pattern}
      />
    </Suspense>
  );
}

