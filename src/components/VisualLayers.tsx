// src/components/VisualLayers.tsx
import React from 'react';
import ParticleField from './ParticleField';
import NeuralMesh from './NeuralMesh';

// VisualLayers aggregates background visual effects.
// It renders particle and neural mesh components fixed to the viewport.
export default function VisualLayers() {
  return (
    <>
      <ParticleField />
      <NeuralMesh />
    </>
  );
}
