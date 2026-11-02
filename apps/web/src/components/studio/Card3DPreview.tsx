'use client';

import * as React from 'react';
import * as THREE from 'three';

interface Card3DPreviewProps {
  imageUrl: string;
  quoteText: string;
  fontFamily: string;
  scrimOpacity: number;
  textColor: string;
  aspectRatio?: '4/5' | '9/16';
}

export function Card3DPreview({
  imageUrl,
  quoteText,
  fontFamily,
  scrimOpacity,
  textColor,
  aspectRatio = '4/5',
}: Card3DPreviewProps) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const cardTextureCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 340;
    const height = mountRef.current.clientHeight || 450;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.replaceChildren(renderer.domElement);

    // 2. Create offscreen 2D canvas for the card face
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = aspectRatio === '4/5' ? 1350 : 1920;
    cardTextureCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    // Helper to draw the card face
    const updateCanvasTexture = () => {
      if (!ctx) return;
      // Background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onload = () => {
        // Draw image cover
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (canvas.width - img.width * ratio) / 2;
        const centerShiftY = (canvas.height - img.height * ratio) / 2;
        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          centerShiftX,
          centerShiftY,
          img.width * ratio,
          img.height * ratio,
        );

        // Dark gradient scrim
        const scrimGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        scrimGrad.addColorStop(0, `rgba(0,0,0,${scrimOpacity * 0.7})`);
        scrimGrad.addColorStop(0.5, `rgba(0,0,0,${scrimOpacity})`);
        scrimGrad.addColorStop(1, `rgba(0,0,0,${Math.min(scrimOpacity * 1.3, 0.95)})`);
        ctx.fillStyle = scrimGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Quote text
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 48px ${fontFamily}, "Space Grotesk", sans-serif`;

        // Word wrap
        const words = (quoteText || 'Your quote will appear here').split(' ');
        let line = '';
        const lines: string[] = [];
        const maxLineWidth = canvas.width * 0.8;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxLineWidth && i > 0) {
            lines.push(line);
            line = words[i] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);

        const lineHeight = 68;
        const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((l, idx) => {
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
          ctx.fillText(l.trim(), canvas.width / 2, startY + idx * lineHeight);
        });

        texture.needsUpdate = true;
      };
    };

    updateCanvasTexture();

    // 3. 3D Card Geometry
    const cardW = 2.4;
    const cardH = aspectRatio === '4/5' ? 3.0 : 4.2;
    const cardGeometry = new THREE.PlaneGeometry(cardW, cardH, 32, 32);

    const cardMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
    scene.add(cardMesh);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(4, 5, 4);
    scene.add(directionalLight);

    const accentLight = new THREE.PointLight(0xec4899, 2.5, 10);
    accentLight.position.set(-3, -2, 2);
    scene.add(accentLight);

    // 5. Mouse Parallax Tilt
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotationY = x * 0.45;
      targetRotationX = -y * 0.45;
    };

    const handleMouseLeave = () => {
      targetRotationX = 0;
      targetRotationY = 0;
    };

    const dom = mountRef.current;
    dom.addEventListener('mousemove', handleMouseMove);
    dom.addEventListener('mouseleave', handleMouseLeave);

    // 6. Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      cardMesh.rotation.x += (targetRotationX - cardMesh.rotation.x) * 0.08;
      cardMesh.rotation.y += (targetRotationY - cardMesh.rotation.y) * 0.08;

      // Subtle breathing float
      cardMesh.position.y = Math.sin(Date.now() * 0.0015) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousemove', handleMouseMove);
      dom.removeEventListener('mouseleave', handleMouseLeave);
      renderer.dispose();
      cardGeometry.dispose();
      cardMaterial.dispose();
      texture.dispose();
    };
  }, [imageUrl, quoteText, fontFamily, scrimOpacity, textColor, aspectRatio]);

  return (
    <div className="relative w-full h-[460px] flex items-center justify-center overflow-hidden rounded-2xl bg-surface-100/60 border border-surface-300">
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-surface-600">
          3D Interactive Tilt Preview
        </span>
      </div>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
