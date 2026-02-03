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

import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Spin,
  Table,
  Tag,
  Typography,
  Empty,
  Popconfirm,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconEdit } from '@douyinfe/semi-icons';
import { API, showError, showSuccess, getFixedColumnStyle } from '../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

export default function TokenGroupConfigEditor({ options, refresh }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({});
  const [userGroups, setUserGroups] = useState(['default']);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ratios: {},
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  // 从旧配置构建（提前定义，供多处使用）
  const buildConfigFromLegacy = (opts) => {
    try {
      const groupRatio = opts?.GroupRatio ? JSON.parse(opts.GroupRatio) : {};
      const userUsableGroups = opts?.UserUsableGroups ? JSON.parse(opts.UserUsableGroups) : {};
      const groupGroupRatio = opts?.GroupGroupRatio ? JSON.parse(opts.GroupGroupRatio) : {};

      const newConfig = {};

      // 为每个令牌分组创建配置
      Object.keys(groupRatio).forEach(tokenGroup => {
        const baseRatio = groupRatio[tokenGroup];
        const description = userUsableGroups[tokenGroup] || tokenGroup;

        const ratios = { default: baseRatio };

        // 添加其他用户分组的特殊倍率
        Object.keys(groupGroupRatio).forEach(userGroup => {
          if (groupGroupRatio[userGroup]?.[tokenGroup] !== undefined) {
            ratios[userGroup] = groupGroupRatio[userGroup][tokenGroup];
          } else {
            ratios[userGroup] = baseRatio;
          }
        });

        newConfig[tokenGroup] = { description, ratios };
      });

      return newConfig;
    } catch (e) {
      console.error('Failed to build config from legacy:', e);
      return {};
    }
  };

  // 从选项中提取用户分组列表
  useEffect(() => {
    const groups = new Set(['default']);

    // 从 GroupGroupRatio 中提取用户分组
    if (options?.GroupGroupRatio) {
      try {
        const groupGroupRatio = JSON.parse(options.GroupGroupRatio);
        Object.keys(groupGroupRatio).forEach(g => groups.add(g));
      } catch (e) {
        // 静默处理
      }
    }

    // 从现有配置中提取用户分组
    if (options?.TokenGroupConfig) {
      try {
        const tokenConfig = JSON.parse(options.TokenGroupConfig);
        Object.values(tokenConfig).forEach(item => {
          if (item.ratios) {
            Object.keys(item.ratios).forEach(g => groups.add(g));
          }
        });
      } catch (e) {
        // 静默处理
      }
    }

    // 从当前config中提取
    Object.values(config).forEach(item => {
      if (item.ratios) {
        Object.keys(item.ratios).forEach(g => groups.add(g));
      }
    });

    setUserGroups(Array.from(groups).sort());
  }, [options?.GroupGroupRatio, options?.TokenGroupConfig, config]);

  // 当options变化时，从旧配置构建（如果API未加载成功）
  useEffect(() => {
    if (!configLoaded && options?.GroupRatio) {
      const legacyConfig = buildConfigFromLegacy(options);
      if (Object.keys(legacyConfig).length > 0) {
        setConfig(legacyConfig);
      }
    }
  }, [options?.GroupRatio, options?.UserUsableGroups, options?.GroupGroupRatio, configLoaded]);

  // 加载配置（仅首次）
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/group/token-config', { skipErrorHandler: true });
      if (res.data.success) {
        const data = res.data.data || {};
        if (Object.keys(data).length > 0) {
          setConfig(data);
          setConfigLoaded(true);
        } else {
          // API返回空数据，使用旧配置
          const legacyConfig = buildConfigFromLegacy(options);
          setConfig(legacyConfig);
        }
      } else {
        // API返回失败，静默使用旧配置
        const legacyConfig = buildConfigFromLegacy(options);
        setConfig(legacyConfig);
      }
    } catch (error) {
      // API不存在或出错，静默使用旧配置（不弹出错误）
      console.log('TokenGroupConfig API not available, using legacy config');
      const legacyConfig = buildConfigFromLegacy(options);
      setConfig(legacyConfig);
    } finally {
      setLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async () => {
    setLoading(true);
    try {
      // 尝试使用新API保存
      const res = await API.put('/api/group/token-config', { config }, { skipErrorHandler: true });
      if (res.data.success) {
        showSuccess(t('保存成功'));
        refresh();
        return;
      } else {
        showError(res.data.message || t('保存失败'));
      }
    } catch (error) {
      // 新API不可用，使用旧方式保存
      console.log('TokenGroupConfig API not available, using legacy save');
      try {
        await saveLegacyConfig();
        showSuccess(t('保存成功'));
        refresh();
      } catch (legacyError) {
        console.error('Failed to save legacy config:', legacyError);
        showError(t('保存失败'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 使用旧方式保存配置
  const saveLegacyConfig = async () => {
    // 从统一配置生成旧格式
    const groupRatio = {};
    const userUsableGroups = {};
    const groupGroupRatio = {};

    Object.entries(config).forEach(([tokenGroup, item]) => {
      // GroupRatio: 使用default用户分组的倍率作为基础倍率
      groupRatio[tokenGroup] = item.ratios?.default ?? 1.0;

      // UserUsableGroups: 描述
      userUsableGroups[tokenGroup] = item.description || tokenGroup;

      // GroupGroupRatio: 非default用户分组的特殊倍率
      Object.entries(item.ratios || {}).forEach(([userGroup, ratio]) => {
        if (userGroup !== 'default') {
          if (!groupGroupRatio[userGroup]) {
            groupGroupRatio[userGroup] = {};
          }
          groupGroupRatio[userGroup][tokenGroup] = ratio;
        }
      });
    });

    // 保存三个旧配置项
    const requests = [
      API.put('/api/option/', { key: 'GroupRatio', value: JSON.stringify(groupRatio) }),
      API.put('/api/option/', { key: 'UserUsableGroups', value: JSON.stringify(userUsableGroups) }),
      API.put('/api/option/', { key: 'GroupGroupRatio', value: JSON.stringify(groupGroupRatio) }),
    ];

    const results = await Promise.all(requests);
    const failed = results.some(res => !res.data.success);
    if (failed) {
      throw new Error('部分配置保存失败');
    }
  };

  // 打开添加/编辑模态框
  const openModal = (groupName = null) => {
    if (groupName) {
      // 编辑模式
      const item = config[groupName];
      setEditingGroup(groupName);
      setFormData({
        name: groupName,
        description: item.description || '',
        ratios: { ...item.ratios },
      });
    } else {
      // 添加模式
      setEditingGroup(null);
      const defaultRatios = {};
      userGroups.forEach(g => {
        defaultRatios[g] = 1.0;
      });
      setFormData({
        name: '',
        description: '',
        ratios: defaultRatios,
      });
    }
    setModalVisible(true);
  };

  // 保存模态框数据
  const handleModalOk = () => {
    if (!formData.name.trim()) {
      showError(t('请输入分组名称'));
      return;
    }

    if (editingGroup === null && config[formData.name]) {
      showError(t('分组名称已存在'));
      return;
    }

    const newConfig = { ...config };

    // 如果是编辑且名称改变，删除旧的
    if (editingGroup && editingGroup !== formData.name) {
      delete newConfig[editingGroup];
    }

    newConfig[formData.name] = {
      description: formData.description || formData.name,
      ratios: formData.ratios,
    };

    setConfig(newConfig);
    setModalVisible(false);
  };

  // 删除分组
  const deleteGroup = (groupName) => {
    const newConfig = { ...config };
    delete newConfig[groupName];
    setConfig(newConfig);
  };

  // 添加用户分组
  const addUserGroup = () => {
    Modal.confirm({
      title: t('添加用户分组'),
      content: (
        <Input
          id="new-user-group-input"
          placeholder={t('输入用户分组名称')}
          style={{ marginTop: 10 }}
        />
      ),
      onOk: () => {
        const input = document.getElementById('new-user-group-input');
        const newGroup = input?.value?.trim();
        if (newGroup && !userGroups.includes(newGroup)) {
          setUserGroups([...userGroups, newGroup].sort());
          // 为所有令牌分组添加新用户分组的默认倍率
          const newConfig = { ...config };
          Object.keys(newConfig).forEach(tokenGroup => {
            if (!newConfig[tokenGroup].ratios[newGroup]) {
              newConfig[tokenGroup].ratios[newGroup] = 1.0;
            }
          });
          setConfig(newConfig);
        }
      },
    });
  };

  // 表格列定义
  const columns = [
    {
      title: t('令牌分组'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: t('描述'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
    },
    ...userGroups.map(userGroup => ({
      title: (
        <span>
          {userGroup === 'default' ? (
            <Tag color="blue">{t('默认')}</Tag>
          ) : (
            <Tag color="green">{userGroup}</Tag>
          )}
        </span>
      ),
      dataIndex: 'ratios',
      key: `ratio_${userGroup}`,
      width: 100,
      render: (ratios) => (
        <Text>{ratios?.[userGroup] ?? 1.0}</Text>
      ),
    })),
    {
      title: t('操作'),
      key: 'action',
      width: 120,
      fixed: 'right',
      ...getFixedColumnStyle(),
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<IconEdit />}
            size="small"
            onClick={() => openModal(record.name)}
          />
          <Popconfirm
            title={t('确定删除此分组？')}
            onConfirm={() => deleteGroup(record.name)}
          >
            <Button
              icon={<IconDelete />}
              size="small"
              type="danger"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 表格数据
  const tableData = Object.entries(config).map(([name, item]) => ({
    key: name,
    name,
    description: item.description,
    ratios: item.ratios || {},
  }));

  return (
    <Spin spinning={loading}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title heading={5} style={{ margin: 0 }}>{t('令牌分组配置')}</Title>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                icon={<IconPlus />}
                onClick={addUserGroup}
              >
                {t('添加用户分组')}
              </Button>
              <Button
                icon={<IconPlus />}
                type="primary"
                onClick={() => openModal()}
              >
                {t('添加令牌分组')}
              </Button>
            </div>
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="tertiary">
            {t('配置令牌分组及各用户分组的倍率。用户创建令牌时可选择令牌分组，计费时使用对应的倍率。')}
          </Text>
        </div>

        {tableData.length > 0 ? (
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            scroll={{ x: 'max-content' }}
            size="small"
          />
        ) : (
          <Empty description={t('暂无令牌分组配置')} />
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button type="primary" onClick={saveConfig}>
            {t('保存配置')}
          </Button>
          <Button onClick={loadConfig}>
            {t('重新加载')}
          </Button>
        </div>
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingGroup ? t('编辑令牌分组') : t('添加令牌分组')}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong>{t('分组名称')}</Text>
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder={t('输入分组名称，如 default, vip')}
              disabled={editingGroup !== null}
              style={{ marginTop: 4 }}
            />
          </div>

          <div>
            <Text strong>{t('分组描述')}</Text>
            <Input
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder={t('输入分组描述，用户可见')}
              style={{ marginTop: 4 }}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              {t('各用户分组倍率')}
            </Text>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12
            }}>
              {userGroups.map(userGroup => (
                <div
                  key={userGroup}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'var(--semi-color-fill-0)',
                    borderRadius: 6,
                  }}
                >
                  <Tag color={userGroup === 'default' ? 'blue' : 'green'} style={{ minWidth: 60 }}>
                    {userGroup}
                  </Tag>
                  <InputNumber
                    value={formData.ratios[userGroup] ?? 1.0}
                    onChange={(value) => setFormData({
                      ...formData,
                      ratios: { ...formData.ratios, [userGroup]: value },
                    })}
                    min={0}
                    step={0.1}
                    precision={2}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </Spin>
  );
}
