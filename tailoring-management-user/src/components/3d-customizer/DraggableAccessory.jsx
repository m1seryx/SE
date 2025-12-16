import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useRef, useState, Suspense, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Component to load accessory model with error handling
function AccessoryModel({ modelPath, color }) {
    const { scene: accessoryModel } = useGLTF(modelPath);
    const clonedScene = useMemo(() => accessoryModel ? accessoryModel.clone() : null, [accessoryModel]);

    useLayoutEffect(() => {
        if (clonedScene) {
            // Rotate model to face forward (toward camera)
            clonedScene.rotation.y = -Math.PI / 2; // -90 degrees

            clonedScene.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({
                        color: new THREE.Color(color),
                        roughness: 0.3,
                        metalness: 0.6,
                    });
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
    }, [clonedScene, color]);

    if (!clonedScene) {
        return (
            <mesh>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#ff0000" />
            </mesh>
        );
    }

    return <primitive object={clonedScene} />;
}

export default function DraggableAccessory({ id, modelPath, position, color, scale = 0.2, onPositionChange, onSelect, isSelected, onMovingChange }) {
    const groupRef = useRef();
    const [isMoving, setIsMoving] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const { camera, raycaster, pointer, gl, scene } = useThree();

    // Helper function to check if an object is a child of the accessory group
    const isPartOfAccessory = (object) => {
        let current = object;
        while (current) {
            if (current === groupRef.current) return true;
            current = current.parent;
        }
        return false;
    };

    // Follow cursor on surface when in moving mode
    useFrame(() => {
        if (isMoving && groupRef.current) {
            raycaster.setFromCamera(pointer, camera);

            // Raycast against all objects in the scene
            const intersects = raycaster.intersectObjects(scene.children, true);

            // Find the first hit that is NOT this accessory itself
            const hit = intersects.find(i =>
                !isPartOfAccessory(i.object) &&
                i.object.visible &&
                i.object.isMesh
            );

            if (hit) {
                // Smooth movement to the intersection point
                const targetPos = hit.point.clone();
                groupRef.current.position.lerp(targetPos, 0.3);
            }
        }
    });

    const handleClick = (e) => {
        e.stopPropagation();

        if (!isMoving) {
            // First click - pick up the accessory
            setIsMoving(true);
            onSelect(id);
            gl.domElement.style.cursor = 'move';
            if (onMovingChange) onMovingChange(true);
        } else {
            // Second click - place the accessory
            setIsMoving(false);
            if (groupRef.current) {
                const newPos = groupRef.current.position.toArray();
                onPositionChange(id, newPos);
            }
            gl.domElement.style.cursor = isHovered ? 'pointer' : 'default';
            if (onMovingChange) onMovingChange(false);
        }
    };

    const handlePointerEnter = () => {
        setIsHovered(true);
        if (!isMoving) {
            gl.domElement.style.cursor = 'pointer';
        }
    };

    const handlePointerLeave = () => {
        setIsHovered(false);
        if (!isMoving) {
            gl.domElement.style.cursor = 'default';
        }
    };

    // Construct full URL if it's a relative path
    const fullModelPath = useMemo(() => {
        if (!modelPath) {
            console.warn('DraggableAccessory: No modelPath provided');
            return modelPath;
        }
        
        // If already a full URL, use it
        if (modelPath.startsWith('http')) {
            console.log('DraggableAccessory: Using full URL:', modelPath);
            return modelPath;
        }
        
        // If it starts with /, it's a path from root - construct full URL
        const baseUrl = window.location.origin.includes('localhost') 
            ? 'http://localhost:5000'
            : window.location.origin.replace(/:\d+$/, ':5000');
        
        const fullPath = modelPath.startsWith('/') 
            ? `${baseUrl}${modelPath}`
            : `${baseUrl}/${modelPath}`;
        
        console.log('DraggableAccessory: Constructed URL:', fullPath, 'from:', modelPath);
        return fullPath;
    }, [modelPath]);

    return (
        <group
            ref={groupRef}
            position={position}
            scale={scale}
            onClick={handleClick}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
        >
            <Suspense fallback={
                <mesh>
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshStandardMaterial color="#cccccc" />
                </mesh>
            }>
                <AccessoryModel modelPath={fullModelPath} color={color} />
            </Suspense>

            {/* Visual feedback */}
            {(isSelected || isHovered || isMoving) && (
                <mesh position={[0, 0, 0]} scale={1.2}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial
                        transparent
                        opacity={isMoving ? 0.4 : isSelected ? 0.2 : 0.1}
                        color={isMoving ? "#00ff00" : isSelected ? "#ffff00" : "#ffffff"}
                        wireframe
                    />
                </mesh>
            )}

            {/* Pulsing indicator when in moving mode */}
            {isMoving && (
                <mesh position={[0, 0, 0]} scale={1.5}>
                    <sphereGeometry args={[1, 16, 16]} />
                    <meshBasicMaterial
                        transparent
                        opacity={0.2}
                        color="#00ff00"
                        wireframe
                    />
                </mesh>
            )}
        </group>
    );
}
