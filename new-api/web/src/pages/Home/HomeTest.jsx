/*
科幻星空主页测试版 v2
- 动态漂移星空背景
- 鼠标一度连接点效果（鼠标为中心，周围点连接到鼠标）
*/

import React, { useEffect, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Typography, Space, Input } from '@douyinfe/semi-ui';
import { IconCopy, IconBookStroked } from '@douyinfe/semi-icons';
import { StatusContext } from '../../context/Status';
import { copy, showSuccess } from '../../helpers';
import {
  OpenAI, Claude, Gemini, Moonshot, Zhipu, Qwen, DeepSeek, Minimax,
  Wenxin, Spark, Midjourney, Hunyuan, Cohere, Cloudflare, Ai360, Yi,
  Jina, Mistral, XAI, Ollama, Doubao, Suno, Xinference, OpenRouter,
  Dify, Coze, SiliconCloud, FastGPT, Kling, Jimeng, Perplexity, Replicate,
} from '@lobehub/icons';

const { Title, Text } = Typography;

// 星空背景 Canvas 组件
const StarfieldCanvas = () => {
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
          // 漂移速度
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
        });
      }
    };

    // 初始化连接节点（静态分布，用于鼠标连接）
    const initNodes = () => {
      nodesRef.current = [];
      const nodeCount = 80;
      for (let i = 0; i < nodeCount; i++) {
        nodesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1.5,
          // 缓慢漂移
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        });
      }
    };

    // 鼠标移动事件
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 绘制深空渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#0f0f2a');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 绘制星云效果
      drawNebula(ctx, width, height);

      // 更新和绘制星星（漂移）
      const time = Date.now() * 0.001;
      starsRef.current.forEach((star) => {
        // 更新位置（漂移）
        star.x += star.vx;
        star.y += star.vy;

        // 边界循环
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        // 闪烁效果
        const twinkle = Math.sin(time * star.twinkleSpeed * 10 + star.twinklePhase) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();
      });

      // 更新节点位置（缓慢漂移）
      nodesRef.current.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        // 边界循环
        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;
      });

      // 绘制鼠标一度连接效果
      const mouse = mouseRef.current;
      const connectionRadius = 180; // 连接半径

      // 找出鼠标范围内的节点
      const nearbyNodes = nodesRef.current.filter((node) => {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        return Math.sqrt(dx * dx + dy * dy) < connectionRadius;
      });

      // 绘制节点之间的连线（在鼠标范围内的节点互相连接）
      nearbyNodes.forEach((node, i) => {
        nearbyNodes.forEach((other, j) => {
          if (i >= j) return;
          const lineDx = node.x - other.x;
          const lineDy = node.y - other.y;
          const lineDist = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
          const maxLineDist = 120;

          if (lineDist < maxLineDist) {
            const opacity = (1 - lineDist / maxLineDist) * 0.4;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // 绘制鼠标到节点的连线
      nearbyNodes.forEach((node) => {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const opacity = (1 - dist / connectionRadius) * 0.6;

        // 连线到鼠标
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 绘制所有节点
      nodesRef.current.forEach((node) => {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const isNearby = dist < connectionRadius;
        const nodeOpacity = isNearby ? 0.9 : 0.3;
        const nodeSize = isNearby ? node.size * 1.5 : node.size;

        // 外圈光晕（仅在鼠标附近时显示）
        if (isNearby) {
          const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, nodeSize * 4);
          glowGradient.addColorStop(0, `rgba(0, 255, 136, ${nodeOpacity * 0.4})`);
          glowGradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeSize * 4, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();
        }

        // 节点核心
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 136, ${nodeOpacity})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(0, 0, 0, ${nodeOpacity * 0.9})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 绘制鼠标中心点
      if (mouse.x > 0 && mouse.y > 0) {
        // 外圈光晕
        const mouseGlow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 30);
        mouseGlow.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
        mouseGlow.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = mouseGlow;
        ctx.fill();

        // 中心点
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

    // 绘制星云
    const drawNebula = (ctx, w, h) => {
      // 紫色星云
      const nebula1 = ctx.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, w * 0.4);
      nebula1.addColorStop(0, 'rgba(100, 50, 150, 0.1)');
      nebula1.addColorStop(0.5, 'rgba(80, 40, 120, 0.05)');
      nebula1.addColorStop(1, 'rgba(60, 30, 90, 0)');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, w, h);

      // 青色星云
      const nebula2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 0, w * 0.8, h * 0.7, w * 0.3);
      nebula2.addColorStop(0, 'rgba(0, 150, 200, 0.08)');
      nebula2.addColorStop(0.5, 'rgba(0, 120, 160, 0.04)');
      nebula2.addColorStop(1, 'rgba(0, 90, 120, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, w, h);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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
        zIndex: 0,
      }}
    />
  );
};

// 供应商图标组件
const ProviderIcons = () => {
  const icons = [
    OpenAI, Claude, Gemini, Moonshot, Zhipu, Qwen, DeepSeek, Minimax,
    Wenxin, Spark, Midjourney, Hunyuan, Cohere, Cloudflare, Ai360, Yi,
    Jina, Mistral, XAI, Ollama, Doubao, Suno, Xinference, OpenRouter,
    Dify, Coze, SiliconCloud, FastGPT, Kling, Jimeng, Perplexity, Replicate,
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8 max-w-4xl mx-auto">
      {icons.map((Icon, index) => (
        <div
          key={index}
          className="w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Icon size={28} />
        </div>
      ))}
    </div>
  );
};

const HomeTest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusState] = useContext(StatusContext);
  const serverAddress = statusState?.status?.server_address || window.location.origin;

  const handleCopyBaseUrl = () => {
    copy(serverAddress + '/v1');
    showSuccess(t('已复制到剪贴板'));
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 星空背景 */}
      <StarfieldCanvas />

      {/* 内容层 */}
      <div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16"
      >
        {/* 主标题 */}
        <div className="text-center mb-8">
          <Title
            heading={1}
            className="!text-5xl md:!text-6xl !font-bold !mb-4"
            style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00d9ff 50%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(0, 255, 136, 0.3)',
            }}
          >
            {statusState?.status?.system_name || 'New API'}
          </Title>
          <Text
            className="!text-xl md:!text-2xl"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            {t('统一的大模型接口网关')}
          </Text>
        </div>

        {/* BASE URL 输入框 */}
        <div
          className="w-full max-w-xl mb-8 p-1 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.3), rgba(0, 217, 255, 0.3))',
          }}
        >
          <div
            className="flex items-center rounded-xl overflow-hidden"
            style={{
              background: 'rgba(10, 10, 26, 0.9)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <span
              className="px-4 py-3 text-sm font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              BASE URL
            </span>
            <Input
              value={serverAddress + '/v1'}
              readOnly
              className="flex-1 !bg-transparent !border-none"
              style={{ color: '#00ff88' }}
            />
            <Button
              icon={<IconCopy />}
              theme="borderless"
              onClick={handleCopyBaseUrl}
              className="!mr-2"
              style={{ color: '#00d9ff' }}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <Space spacing="loose" className="mb-12">
          <Button
            theme="solid"
            size="large"
            onClick={() => navigate('/token')}
            className="!px-8 !py-3 !rounded-xl !font-semibold"
            style={{
              background: 'linear-gradient(135deg, #00ff88, #00d9ff)',
              border: 'none',
              color: '#0a0a1a',
              boxShadow: '0 0 30px rgba(0, 255, 136, 0.4)',
            }}
          >
            {t('获取密钥')}
          </Button>
          <Button
            theme="light"
            size="large"
            icon={<IconBookStroked />}
            onClick={() => window.open(statusState?.status?.docs_link || 'https://docs.newapi.pro', '_blank')}
            className="!px-8 !py-3 !rounded-xl !font-semibold"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
            }}
          >
            {t('查看文档')}
          </Button>
        </Space>

        {/* 供应商图标 */}
        <div className="text-center">
          <Text
            className="!text-sm !mb-4 block"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            {t('支持 30+ AI 服务商')}
          </Text>
          <ProviderIcons />
        </div>
      </div>
    </div>
  );
};

export default HomeTest;
