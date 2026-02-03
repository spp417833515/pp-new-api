/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useRef, useEffect } from 'react';

/**
 * 星空背景 Canvas 组件
 * @param {number} opacity - 透明度 (0-1)，默认 1
 * @param {number} blur - 模糊程度 (px)，默认 0
 * @param {number} zIndex - 层级，默认 0
 */
const StarfieldCanvas = ({ opacity = 1, blur = 0, zIndex = 0 }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const starsRef = useRef([]);
  const nodesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
      initNodes();
    };

    // 初始化星星（带漂移速度）
    const initStars = () => {
      starsRef.current = [];
      const starCount = Math.floor((width * height) / 6000);
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
        });
      }
    };

    // 初始化连接节点
    const initNodes = () => {
      nodesRef.current = [];
      const nodeCount = 80;
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        });
      }
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 深空渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#0f0f2a');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 星云效果
      const nebula1 = ctx.createRadialGradient(width * 0.2, height * 0.3, 0, width * 0.2, height * 0.3, width * 0.4);
      nebula1.addColorStop(0, 'rgba(100, 50, 150, 0.1)');
      nebula1.addColorStop(0.5, 'rgba(80, 40, 120, 0.05)');
      nebula1.addColorStop(1, 'rgba(60, 30, 90, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, width * 0.3);
      nebula2.addColorStop(0, 'rgba(0, 150, 200, 0.08)');
      nebula2.addColorStop(0.5, 'rgba(0, 120, 160, 0.04)');
      nebula2.addColorStop(1, 'rgba(0, 90, 120, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // 绘制星星
      const time = Date.now() * 0.001;
      starsRef.current.forEach((star) => {
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();
      });

      // 更新节点位置
      nodesRef.current.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;
      });

      // 鼠标一度连接效果
      const mouse = mouseRef.current;
      const connectionRadius = 180;

      const nearbyNodes = nodesRef.current.filter((node) => {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < connectionRadius;
      });

      // 节点之间连线
      nearbyNodes.forEach((node, i) => {
        nearbyNodes.forEach((other, j) => {
          if (i >= j) return;
          const lineDx = node.x - other.x;
          const lineDy = node.y - other.y;
          const lineDist = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
          if (lineDist < 120) {
            const lineOpacity = (1 - lineDist / 120) * 0.4;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 255, 136, ${lineOpacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // 鼠标到节点连线
      nearbyNodes.forEach((node) => {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const lineOpacity = (1 - dist / connectionRadius) * 0.6;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = `rgba(0, 255, 136, ${lineOpacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 绘制节点
      nodesRef.current.forEach((node) => {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isNearby = dist < connectionRadius;
        const nodeOpacity = isNearby ? 0.9 : 0.3;
        const nodeSize = isNearby ? node.size * 1.5 : node.size;

        if (isNearby) {
          const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeSize * 4);
          glowGradient.addColorStop(0, `rgba(0, 255, 136, ${nodeOpacity * 0.4})`);
          glowGradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeSize * 4, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 136, ${nodeOpacity})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(0, 0, 0, ${nodeOpacity * 0.9})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 鼠标中心点
      if (mouse.x > 0 && mouse.y > 0) {
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 30);
        mouseGlow.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
        mouseGlow.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 136, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : 'none',
        pointerEvents: 'none',
      }}
    />
  );
};

export default StarfieldCanvas;
