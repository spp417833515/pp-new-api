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

import React, { useState, useContext } from 'react';
import { Modal, Button, Typography, Toast, Spin } from '@douyinfe/semi-ui';
import { IconRefresh, IconCopy, IconArrowUp } from '@douyinfe/semi-icons';
import { useUpdateCheck } from '../../../hooks/common/useUpdateCheck';
import { UserContext } from '../../../context/User';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const UpdateNotice = () => {
  const { t } = useTranslation();
  const [userState] = useContext(UserContext);
  const isAdmin = userState?.user?.role >= 10;

  const {
    updateInfo,
    hasUpdate,
    updating,
    executeUpdate,
    rollbackUpdate,
    dismissUpdate,
    checkUpdate,
  } = useUpdateCheck(isAdmin);

  const [modalVisible, setModalVisible] = useState(false);
  const [showCommands, setShowCommands] = useState(false);

  if (!hasUpdate || !updateInfo) {
    return null;
  }

  const handleUpdate = async () => {
    const result = await executeUpdate();
    if (result.success) {
      Toast.success(result.message || t('更新成功，服务即将重启'));
      setModalVisible(false);
      // 5秒后刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } else {
      Toast.error(result.message || t('更新失败'));
    }
  };

  const handleRollback = async () => {
    const result = await rollbackUpdate();
    if (result.success) {
      Toast.success(result.message || t('回退成功，服务即将重启'));
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } else {
      Toast.error(result.message || t('回退失败'));
    }
  };

  const copyCommand = (command) => {
    navigator.clipboard.writeText(command);
    Toast.success(t('已复制到剪贴板'));
  };

  const updateCommands = `docker pull ${updateInfo.image}:latest
docker-compose down
docker-compose up -d`;

  return (
    <>
      {/* 更新提示按钮 */}
      <Button
        theme="solid"
        type="warning"
        size="small"
        icon={<IconArrowUp />}
        onClick={() => setModalVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
        }}
      >
        {t('发现新版本')} {updateInfo.latest_version}
      </Button>

      {/* 更新详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconRefresh style={{ color: 'var(--theme-accent)' }} />
            <span>{t('系统更新')}</span>
          </div>
        }
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          {/* 版本信息 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '24px',
              padding: '16px',
              background: 'var(--theme-glass-bg)',
              borderRadius: 'var(--theme-radius-md)',
              border: '1px solid var(--theme-glass-border)',
            }}
          >
            <div>
              <Text type="secondary">{t('当前版本')}</Text>
              <Title heading={4} style={{ margin: '4px 0 0 0' }}>
                {updateInfo.current_version}
              </Title>
            </div>
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <IconArrowUp
                size="large"
                style={{ color: 'var(--theme-accent)' }}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text type="secondary">{t('最新版本')}</Text>
              <Title
                heading={4}
                style={{ margin: '4px 0 0 0', color: 'var(--theme-success)' }}
              >
                {updateInfo.latest_version}
              </Title>
            </div>
          </div>

          {/* 操作按钮 */}
          {isAdmin ? (
            <div style={{ marginBottom: '16px' }}>
              <Button
                theme="solid"
                type="primary"
                size="large"
                block
                loading={updating}
                icon={<IconRefresh />}
                onClick={handleUpdate}
                style={{ marginBottom: '12px' }}
              >
                {updating ? t('正在更新...') : t('立即更新')}
              </Button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  theme="outline"
                  type="tertiary"
                  block
                  onClick={() => setShowCommands(!showCommands)}
                >
                  {showCommands ? t('隐藏命令') : t('手动更新命令')}
                </Button>
                <Button
                  theme="outline"
                  type="tertiary"
                  block
                  onClick={handleRollback}
                  disabled={updating}
                >
                  {t('回退版本')}
                </Button>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '12px',
                background: 'var(--theme-warning-bg)',
                borderRadius: 'var(--theme-radius-md)',
                marginBottom: '16px',
              }}
            >
              <Text type="warning">
                {t('请联系管理员进行系统更新')}
              </Text>
            </div>
          )}

          {/* 手动更新命令 */}
          {showCommands && (
            <div
              style={{
                background: 'var(--theme-bg-base)',
                borderRadius: 'var(--theme-radius-md)',
                padding: '16px',
                marginBottom: '16px',
                position: 'relative',
              }}
            >
              <Button
                theme="borderless"
                icon={<IconCopy />}
                size="small"
                style={{ position: 'absolute', top: '8px', right: '8px' }}
                onClick={() => copyCommand(updateCommands)}
              />
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'var(--theme-font-mono)',
                  fontSize: '13px',
                  color: 'var(--theme-text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {updateCommands}
              </pre>
            </div>
          )}

          {/* 底部操作 */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              theme="borderless"
              type="tertiary"
              onClick={() => {
                dismissUpdate();
                setModalVisible(false);
              }}
            >
              {t('稍后提醒')}
            </Button>
            <Button
              theme="borderless"
              type="tertiary"
              icon={<IconRefresh />}
              onClick={() => checkUpdate(true)}
            >
              {t('重新检查')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UpdateNotice;
