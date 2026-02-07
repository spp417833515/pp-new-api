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

import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  Button,
  Typography,
  Input,
  Space,
} from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess, sanitizeHTML } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconFile,
  IconCopy,
  IconBookStroked,
} from '@douyinfe/semi-icons';
import { Link, useNavigate } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import StarfieldCanvas from '../../components/common/ui/StarfieldCanvas';
import {
  OpenAI, Claude, Gemini, Moonshot, Zhipu, Qwen, DeepSeek, Minimax,
  Wenxin, Spark, Midjourney, Hunyuan, Cohere, Cloudflare, Ai360, Yi,
  Jina, Mistral, XAI, Ollama, Doubao, Suno, Xinference, OpenRouter,
  Dify, Coze, SiliconCloud, FastGPT, Kling, Jimeng, Perplexity, Replicate,
} from '@lobehub/icons';

const { Title, Text } = Typography;

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

// 科幻星空主页内容
const StarfieldHome = ({ statusState, serverAddress, t, navigate, isMobile }) => {
  const handleCopyBaseUrl = () => {
    copy(serverAddress + '/v1');
    showSuccess(t('已复制到剪贴板'));
  };

  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarfieldCanvas />
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
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
          <Link to="/console">
            <Button
              theme="solid"
              size={isMobile ? 'default' : 'large'}
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
          </Link>
          {isDemoSiteMode && statusState?.status?.version ? (
            <Button
              size={isMobile ? 'default' : 'large'}
              icon={<IconGithubLogo />}
              onClick={() => window.open('https://github.com/QuantumNous/new-api', '_blank')}
              className="!px-8 !py-3 !rounded-xl !font-semibold"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
              }}
            >
              {statusState.status.version}
            </Button>
          ) : (
            docsLink && (
              <Button
                theme="light"
                size={isMobile ? 'default' : 'large'}
                icon={<IconBookStroked />}
                onClick={() => window.open(docsLink, '_blank')}
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
            )
          )}
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

const Home = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const serverAddress = statusState?.status?.server_address || `${window.location.origin}`;

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };
    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <StarfieldHome
          statusState={statusState}
          serverAddress={serverAddress}
          t={t}
          navigate={navigate}
          isMobile={isMobile}
        />
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(homePageContent) }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
