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
  Modal,
} from '@douyinfe/semi-ui';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';

const { Text } = Typography;

export default function SettingsLogManagement(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [cleanLoading, setCleanLoading] = useState(false);
  const [cleanHistoryLoading, setCleanHistoryLoading] = useState(false);
  const [clearAllLoading, setClearAllLoading] = useState(false);
  const [inputs, setInputs] = useState({
    // 日志记录
    LogConsumeEnabled: false,
    // 自动清理
    LogAutoCleanEnabled: false,
    LogMaxCount: 100000,
    LogCleanIntervalMinutes: 30,
    // 按时间清理 (仅前端状态)
    historyTimestamp: dayjs().subtract(1, 'month').toDate(),
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  // 保存设置
  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow).filter(
      (item) => item.key !== 'historyTimestamp',
    );

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

  // 手动清理日志 (按条数)
  async function onCleanLogs() {
    const maxCount = inputs.LogMaxCount || 100000;
    setCleanLoading(true);
    try {
      const res = await API.post(`/api/log/clean?max_count=${maxCount}`);
      const { success, message, data } = res.data;
      if (success) {
        showSuccess(t('已清理 {{count}} 条日志，保留最新 {{max}} 条', { count: data.deleted, max: data.max_count }));
      } else {
        showError(message || t('清理失败'));
      }
    } catch (error) {
      showError(t('清理失败，请重试'));
    } finally {
      setCleanLoading(false);
    }
  }

  // 清空全部日志
  function onClearAllLogs() {
    Modal.confirm({
      title: t('确认清空全部日志'),
      content: (
        <div style={{ lineHeight: '1.8' }}>
          <div
            style={{
              background: 'var(--theme-danger-bg)',
              border: '1px solid var(--theme-danger-border)',
              padding: '12px',
              borderRadius: '4px',
            }}
          >
            <Text strong style={{ color: 'var(--theme-danger)' }}>
              ⚠️ {t('警告')}：
            </Text>
            <Text>{t('此操作将删除所有使用日志，且不可恢复！')}</Text>
          </div>
        </div>
      ),
      okText: t('确认清空'),
      cancelText: t('取消'),
      okType: 'danger',
      onOk: async () => {
        try {
          setClearAllLoading(true);
          const res = await API.delete('/api/log/all');
          const { success, message, data } = res.data;
          if (success) {
            showSuccess(t('已清空 {{count}} 条日志', { count: data.deleted }));
          } else {
            showError(message || t('清空失败'));
          }
        } catch (error) {
          showError(t('清空失败，请重试'));
        } finally {
          setClearAllLoading(false);
        }
      },
    });
  }

  // 清除历史日志 (按时间)
  async function onCleanHistoryLog() {
    if (!inputs.historyTimestamp) {
      showError(t('请选择日志记录时间'));
      return;
    }

    const now = dayjs();
    const targetDate = dayjs(inputs.historyTimestamp);
    const targetTime = targetDate.format('YYYY-MM-DD HH:mm:ss');
    const currentTime = now.format('YYYY-MM-DD HH:mm:ss');
    const daysDiff = now.diff(targetDate, 'day');

    Modal.confirm({
      title: t('确认清除历史日志'),
      content: (
        <div style={{ lineHeight: '1.8' }}>
          <p>
            <Text>{t('当前时间')}：</Text>
            <Text strong style={{ color: 'var(--theme-success)' }}>
              {currentTime}
            </Text>
          </p>
          <p>
            <Text>{t('选择时间')}：</Text>
            <Text strong type='danger'>
              {targetTime}
            </Text>
            {daysDiff > 0 && (
              <Text type='tertiary'>
                {' '}
                ({t('约')} {daysDiff} {t('天前')})
              </Text>
            )}
          </p>
          <div
            style={{
              background: 'var(--theme-warning-bg)',
              border: '1px solid var(--theme-warning-border)',
              padding: '12px',
              borderRadius: '4px',
              marginTop: '12px',
            }}
          >
            <Text strong style={{ color: 'var(--theme-warning)' }}>
              ⚠️ {t('注意')}：
            </Text>
            <Text>{t('将删除')} </Text>
            <Text strong type='danger'>
              {targetTime}
            </Text>
            {daysDiff > 0 && (
              <Text type='tertiary'>
                {' '}
                ({t('约')} {daysDiff} {t('天前')})
              </Text>
            )}
            <Text> {t('之前的所有日志')}</Text>
          </div>
          <p style={{ marginTop: '12px' }}>
            <Text type='danger'>
              {t('此操作不可恢复，请仔细确认时间后再操作！')}
            </Text>
          </p>
        </div>
      ),
      okText: t('确认删除'),
      cancelText: t('取消'),
      okType: 'danger',
      onOk: async () => {
        try {
          setCleanHistoryLoading(true);
          const res = await API.delete(
            `/api/log/?target_timestamp=${Date.parse(inputs.historyTimestamp) / 1000}`,
          );
          const { success, message, data } = res.data;
          if (success) {
            showSuccess(`${data} ${t('条日志已清理！')}`);
            return;
          } else {
            throw new Error(t('日志清理失败：') + message);
          }
        } catch (error) {
          showError(error.message);
        } finally {
          setCleanHistoryLoading(false);
        }
      },
    });
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    currentInputs['historyTimestamp'] = inputs.historyTimestamp;
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
          {/* Section 1: 日志记录 */}
          <Form.Section text={t('日志记录')}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={'LogConsumeEnabled'}
                  label={t('启用额度消费日志记录')}
                  size='default'
                  checkedText='｜'
                  uncheckedText='〇'
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      LogConsumeEnabled: value,
                    });
                  }}
                />
              </Col>
            </Row>
            <Row style={{ marginTop: 8 }}>
              <Col xs={24}>
                <Text type='tertiary' size='small'>
                  {t('开启后将记录每次 API 调用的额度消费详情')}
                </Text>
              </Col>
            </Row>
          </Form.Section>

          <Divider margin='12px' />

          {/* Section 2: 自动清理 */}
          <Form.Section text={t('自动清理')}>
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
                  min={1}
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
          </Form.Section>

          <Divider margin='12px' />

          {/* Section 3: 手动清理 */}
          <Form.Section text={t('手动清理')}>
            <Row gutter={16}>
              {/* 按条数清理 */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {t('按条数清理')}
                  </Text>
                  <Text type='tertiary' size='small' style={{ display: 'block', marginBottom: 12 }}>
                    {t('立即执行一次日志清理，保留最新的 {{count}} 条记录', { count: inputs.LogMaxCount || 100000 })}
                  </Text>
                  <Button
                    type='warning'
                    theme='solid'
                    size='default'
                    loading={cleanLoading}
                    onClick={onCleanLogs}
                  >
                    {t('立即清理日志')}
                  </Button>
                </div>
              </Col>
              {/* 按时间清理 */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Spin spinning={cleanHistoryLoading}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {t('按时间清理')}
                  </Text>
                  <Form.DatePicker
                    label={t('选择截止时间')}
                    field={'historyTimestamp'}
                    type='dateTime'
                    inputReadOnly={true}
                    onChange={(value) => {
                      setInputs({
                        ...inputs,
                        historyTimestamp: value,
                      });
                    }}
                  />
                  <Text
                    type='tertiary'
                    size='small'
                    style={{ display: 'block', marginTop: 4, marginBottom: 12 }}
                  >
                    {t('将清除选定时间之前的所有日志')}
                  </Text>
                  <Button
                    size='default'
                    type='danger'
                    onClick={onCleanHistoryLog}
                  >
                    {t('清除历史日志')}
                  </Button>
                </Spin>
              </Col>
              {/* 全部清理 */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {t('全部清理')}
                  </Text>
                  <Text type='tertiary' size='small' style={{ display: 'block', marginBottom: 12 }}>
                    {t('清空所有使用日志，此操作不可恢复')}
                  </Text>
                  <Button
                    type='danger'
                    theme='solid'
                    size='default'
                    loading={clearAllLoading}
                    onClick={onClearAllLogs}
                  >
                    {t('清空全部日志')}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form.Section>

          <Divider margin='12px' />

          <Row>
            <Button size='default' type='primary' onClick={onSubmit}>
              {t('保存日志管理设置')}
            </Button>
          </Row>
        </Form>
      </Spin>
    </>
  );
}
