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

import React, { useEffect, useState, useRef } from 'react';
import {
  Button,
  Col,
  Form,
  Row,
  Spin,
  Typography,
  Divider,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';

const { Text } = Typography;

export default function SettingsLogAutoClean(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [inputs, setInputs] = useState({
    LogAutoCleanEnabled: false,
    LogMaxCount: 100000,
    LogCleanIntervalMinutes: 30,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);

    if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else if (typeof inputs[item.key] === 'number') {
        value = String(inputs[item.key]);
      } else {
        value = inputs[item.key];
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined))
            return showError(t('部分保存失败，请重试'));
        }
        showSuccess(t('保存成功'));
        props.refresh();
      })
      .catch(() => {
        showError(t('保存失败，请重试'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // 手动清理日志
  async function onCleanLogs() {
    setCleanLoading(true);
    try {
      const res = await API.post('/api/log/clean');
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('已清理 {{count}} 条日志', { count: data.deleted }));
      } else {
        showError(message || t('清理失败'));
      }
    } catch (error) {
      showError(t('清理失败，请重试'));
    } finally {
      setCleanLoading(false);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs((prev) => ({ ...prev, ...currentInputs }));
    setInputsRow({ ...inputs, ...currentInputs });
    if (refForm.current) {
      refForm.current.setValues(currentInputs);
    }
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('日志自动清理')}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                <Form.Switch
                  field={'LogAutoCleanEnabled'}
                  label={t('启用自动清理')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      LogAutoCleanEnabled: value,
                    });
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                <Form.InputNumber
                  field={'LogMaxCount'}
                  label={t('最大保留条数')}
                  min={1000}
                  max={10000000}
                  step={10000}
                  disabled={!inputs.LogAutoCleanEnabled}
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      LogMaxCount: value,
                    });
                  }}
                />
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                <Form.InputNumber
                  field={'LogCleanIntervalMinutes'}
                  label={t('清理间隔(分钟)')}
                  min={5}
                  max={1440}
                  step={5}
                  disabled={!inputs.LogAutoCleanEnabled}
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      LogCleanIntervalMinutes: value,
                    });
                  }}
                />
              </Col>
            </Row>
            <Row style={{ marginTop: 8 }}>
              <Col xs={24}>
                <Text type='tertiary' size='small'>
                  {t('系统将按设定间隔检查日志数量，超过最大保留条数时自动删除最旧的记录')}
                </Text>
              </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Button size='default' onClick={onSubmit}>
                {t('保存自动清理设置')}
              </Button>
            </Row>
          </Form.Section>

          <Divider margin='12px' />

          <Form.Section text={t('手动清理')}>
            <Row gutter={16} style={{ alignItems: 'center' }}>
              <Col xs={24} sm={12} md={8} lg={6} xl={6}>
                <Button
                  type='warning'
                  theme='solid'
                  size='default'
                  loading={cleanLoading}
                  onClick={onCleanLogs}
                >
                  {t('立即清理日志')}
                </Button>
              </Col>
              <Col xs={24} sm={12} md={16} lg={18} xl={18}>
                <Text type='tertiary' size='small'>
                  {t('立即执行一次日志清理，保留最新的 {{count}} 条记录', { count: inputs.LogMaxCount || 100000 })}
                </Text>
              </Col>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
