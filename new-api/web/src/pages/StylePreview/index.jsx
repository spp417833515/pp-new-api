import React, { useState } from 'react';
import { Button, Card, Table, Input, Modal, Tabs, Tag, Switch, Select, Avatar, Progress } from '@douyinfe/semi-ui';
import { IconSearch, IconSetting, IconUser, IconHome, IconStar, IconHeartStroked, IconPlus, IconDelete, IconEdit } from '@douyinfe/semi-icons';
import './styles.css';

const StylePreview = () => {
  const [activeStyle, setActiveStyle] = useState('apple');
  const [modalVisible, setModalVisible] = useState(false);

  const styles = [
    { key: 'apple', name: 'Apple', desc: '毛玻璃 + 扁平化 + 科技灰', color: '#007AFF' },
    { key: 'material', name: 'Material', desc: '阴影层次 + 涟漪效果', color: '#6366f1' },
    { key: 'glass', name: 'Glassmorphism', desc: '全毛玻璃 + 渐变边框', color: '#06b6d4' },
    { key: 'neumorphism', name: 'Neumorphism', desc: '软浮雕 + 凹凸质感', color: '#64748b' },
    { key: 'minimal', name: 'Minimal', desc: '极简 + 大留白 + 黑白', color: '#171717' },
    { key: 'cyberpunk', name: 'Cyberpunk', desc: '霓虹 + 高对比 + 赛博', color: '#f0abfc' },
  ];

  const tableData = [
    { key: '1', name: 'GPT-4', status: '运行中', quota: '1000', type: 'OpenAI' },
    { key: '2', name: 'Claude-3', status: '已停止', quota: '500', type: 'Anthropic' },
    { key: '3', name: 'Gemini', status: '运行中', quota: '800', type: 'Google' },
  ];

  const columns = [
    { title: '模型名称', dataIndex: 'name' },
    { title: '状态', dataIndex: 'status', render: (text) => (
      <Tag color={text === '运行中' ? 'green' : 'grey'}>{text}</Tag>
    )},
    { title: '配额', dataIndex: 'quota' },
    { title: '类型', dataIndex: 'type' },
    { title: '操作', render: () => (
      <div className="table-actions">
        <Button theme="borderless" icon={<IconEdit />} size="small" />
        <Button theme="borderless" icon={<IconDelete />} size="small" type="danger" />
      </div>
    )},
  ];

  return (
    <div className={`style-preview style-${activeStyle}`}>
      {/* 背景装饰 */}
      <div className="style-bg-decoration" />

      {/* 头部 */}
      <header className="style-header">
        <h1>UI 风格选择器</h1>
        <p>选择一种风格，预览效果后确认应用到整个系统</p>
      </header>

      {/* 风格选择卡片 */}
      <section className="style-selector">
        <h2>选择风格</h2>
        <div className="style-grid">
          {styles.map((style) => (
            <div
              key={style.key}
              className={`style-card ${activeStyle === style.key ? 'active' : ''}`}
              onClick={() => setActiveStyle(style.key)}
              style={{ '--accent-color': style.color }}
            >
              <div className="style-card-indicator" />
              <h3>{style.name}</h3>
              <p>{style.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 预览区域 */}
      <section className="style-preview-area">
        <h2>组件预览</h2>

        <div className="preview-layout">
          {/* 模拟侧边栏 */}
          <aside className="preview-sidebar">
            <div className="sidebar-logo">
              <IconStar size="large" />
              <span>NEW API</span>
            </div>
            <nav className="sidebar-menu">
              <div className="menu-group-label">导航</div>
              <div className="menu-item active">
                <IconHome /> <span>首页</span>
              </div>
              <div className="menu-item">
                <IconSetting /> <span>设置</span>
              </div>
              <div className="menu-item">
                <IconUser /> <span>用户</span>
              </div>
              <div className="menu-group-label">管理</div>
              <div className="menu-item">
                <IconStar /> <span>渠道</span>
              </div>
              <div className="menu-item">
                <IconHeartStroked /> <span>令牌</span>
              </div>
            </nav>
          </aside>

          {/* 主内容区 */}
          <main className="preview-main">
            {/* 按钮组 */}
            <Card className="preview-card" title="按钮 Buttons">
              <div className="button-group">
                <Button type="primary">主要按钮</Button>
                <Button type="secondary">次要按钮</Button>
                <Button type="tertiary">第三按钮</Button>
                <Button type="danger">危险按钮</Button>
                <Button type="primary" icon={<IconPlus />}>新建</Button>
                <Button theme="borderless" icon={<IconSetting />} />
              </div>
            </Card>

            {/* 输入框 */}
            <Card className="preview-card" title="输入框 Inputs">
              <div className="input-group">
                <Input placeholder="请输入内容..." prefix={<IconSearch />} />
                <Select placeholder="请选择" style={{ width: 200 }} optionList={[
                  { value: 'gpt4', label: 'GPT-4' },
                  { value: 'claude', label: 'Claude-3' },
                  { value: 'gemini', label: 'Gemini' },
                ]} />
                <Switch defaultChecked />
              </div>
            </Card>

            {/* 标签页 */}
            <Card className="preview-card" title="标签页 Tabs">
              <Tabs>
                <Tabs.TabPane tab="基础设置" itemKey="1">
                  <p>基础设置内容区域</p>
                </Tabs.TabPane>
                <Tabs.TabPane tab="高级设置" itemKey="2">
                  <p>高级设置内容区域</p>
                </Tabs.TabPane>
                <Tabs.TabPane tab="系统设置" itemKey="3">
                  <p>系统设置内容区域</p>
                </Tabs.TabPane>
              </Tabs>
            </Card>

            {/* 表格 */}
            <Card className="preview-card" title="表格 Table">
              <Table columns={columns} dataSource={tableData} pagination={false} />
            </Card>

            {/* 其他组件 */}
            <Card className="preview-card" title="其他组件">
              <div className="misc-components">
                <div className="component-row">
                  <span>标签:</span>
                  <Tag color="blue">蓝色</Tag>
                  <Tag color="green">绿色</Tag>
                  <Tag color="orange">橙色</Tag>
                  <Tag color="red">红色</Tag>
                </div>
                <div className="component-row">
                  <span>头像:</span>
                  <Avatar.Group>
                    <Avatar color="blue">A</Avatar>
                    <Avatar color="green">B</Avatar>
                    <Avatar color="orange">C</Avatar>
                  </Avatar.Group>
                </div>
                <div className="component-row">
                  <span>进度:</span>
                  <Progress percent={70} style={{ width: 200 }} />
                </div>
              </div>
            </Card>

            {/* 弹窗测试 */}
            <Card className="preview-card" title="弹窗 Modal">
              <Button type="primary" onClick={() => setModalVisible(true)}>
                打开弹窗
              </Button>
              <Modal
                title="示例弹窗"
                visible={modalVisible}
                onOk={() => setModalVisible(false)}
                onCancel={() => setModalVisible(false)}
              >
                <p>这是一个示例弹窗，展示当前风格的弹窗效果。</p>
                <Input placeholder="弹窗内的输入框" style={{ marginTop: 16 }} />
              </Modal>
            </Card>
          </main>
        </div>
      </section>

      {/* 确认按钮 */}
      <footer className="style-footer">
        <div className="footer-info">
          <span>当前选择: <strong>{styles.find(s => s.key === activeStyle)?.name}</strong></span>
        </div>
        <div className="footer-actions">
          <Button type="tertiary" size="large">重置为默认</Button>
          <Button type="primary" size="large">应用此风格</Button>
        </div>
      </footer>
    </div>
  );
};

export default StylePreview;
