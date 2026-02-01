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
import { Spin, Tabs, TabPane } from '@douyinfe/semi-ui';
import { Trash2, Link2, ShieldAlert } from 'lucide-react';
import SettingsLogAutoClean from '../../pages/Setting/Custom/SettingsLogAutoClean';
import SettingsChannelAffinity from '../../pages/Setting/Operation/SettingsChannelAffinity';
import SettingsSensitiveWords from '../../pages/Setting/Operation/SettingsSensitiveWords';
import { API, showError, toBoolean } from '../../helpers';
import { useTranslation } from 'react-i18next';

const CustomFeatureSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    /* 日志自动清理 */
    LogAutoCleanEnabled: false,
    LogMaxCount: 100000,
    LogCleanIntervalMinutes: 30,
    /* 渠道亲和性 */
    'channel_affinity_setting.enabled': false,
    'channel_affinity_setting.switch_on_success': true,
    'channel_affinity_setting.max_entries': 100000,
    'channel_affinity_setting.default_ttl_seconds': 3600,
    'channel_affinity_setting.rules': '[]',
    /* 屏蔽词过滤 */
    CheckSensitiveEnabled: false,
    CheckSensitiveOnPromptEnabled: false,
    SensitiveWords: '',
    SensitiveWordsThreshold: 1,
  });

  let [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('log-clean');

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        if (typeof inputs[item.key] === 'boolean') {
          newInputs[item.key] = toBoolean(item.value);
        } else if (typeof inputs[item.key] === 'number') {
          newInputs[item.key] = parseInt(item.value, 10) || inputs[item.key];
        } else {
          newInputs[item.key] = item.value;
        }
      });

      setInputs(newInputs);
    } else {
      showError(message);
    }
  };

  async function onRefresh() {
    try {
      setLoading(true);
      await getOptions();
    } catch (error) {
      showError('刷新失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onRefresh();
  }, []);

  const tabList = [
    {
      tab: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trash2 size={16} />
          {t('日志清理')}
        </span>
      ),
      itemKey: 'log-clean',
      content: <SettingsLogAutoClean options={inputs} refresh={onRefresh} />,
    },
    {
      tab: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link2 size={16} />
          {t('渠道亲和性')}
        </span>
      ),
      itemKey: 'channel-affinity',
      content: <SettingsChannelAffinity options={inputs} refresh={onRefresh} />,
    },
    {
      tab: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={16} />
          {t('屏蔽词过滤')}
        </span>
      ),
      itemKey: 'sensitive-words',
      content: <SettingsSensitiveWords options={inputs} refresh={onRefresh} />,
    },
  ];

  return (
    <Spin spinning={loading} size='large'>
      <Tabs
        type='card'
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        style={{ marginTop: '10px' }}
      >
        {tabList.map((item) => (
          <TabPane tab={item.tab} itemKey={item.itemKey} key={item.itemKey}>
            {activeTab === item.itemKey && item.content}
          </TabPane>
        ))}
      </Tabs>
    </Spin>
  );
};

export default CustomFeatureSetting;
