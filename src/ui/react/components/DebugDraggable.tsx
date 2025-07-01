import React, { useEffect } from 'react';
import { SimpleDraggableWrapper } from './floating/SimpleDraggableWrapper';

export const DebugDraggable: React.FC = () => {
  useEffect(() => {
    console.log('DebugDraggable mounted');
    
    // Check for draggable elements after mount
    setTimeout(() => {
      const draggables = document.querySelectorAll('[id*="draggable"]');
      console.log('Found draggable elements:', draggables.length);
      draggables.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        console.log(`${i}: ${el.id}`, {
          visible: rect.width > 0 && rect.height > 0,
          position: { x: rect.x, y: rect.y },
          size: { width: rect.width, height: rect.height }
        });
      });
    }, 1000);
  }, []);

  return (
    <SimpleDraggableWrapper
      id="debug-draggable"
      defaultPosition={{ x: 50, y: 50 }}
      draggable={true}
      persistent={false}
      zIndex={9999}
      style={{
        backgroundColor: '#10b981',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}
    >
      Debug: Drag Me!
    </SimpleDraggableWrapper>
  );
};