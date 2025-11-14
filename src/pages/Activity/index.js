import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, message, Space, Tag, Popconfirm, Input, Select, Card, Row, Col, Statistic, Alert, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, EyeOutlined, HomeOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';

import { useModal } from '~/hooks';
import ActivityForm from './ActivityForm';
import config from '~/config';
import {
  getActivityList,
  createActivity,
  updateActivity,
  deleteActivity,
  updateActivityStatus,
  batchUpdateActivityStatus,
  batchDeleteActivities,
  getActivityStats,
} from '~/services/activityService';
import styles from './Activity.module.scss';

const { Search } = Input;
const { Option } = Select;

const cx = classNames.bind(styles);

function Activity() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    ended: 0,
    running: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  
  // 调试信息显示控制（从 localStorage 读取初始值）
  const [debugInfoVisible, setDebugInfoVisible] = useState(() => {
    const saved = localStorage.getItem('debugInfoVisible');
    return saved === 'true';
  });

  // 弹窗管理
  const createModal = useModal();
  const editModal = useModal();
  const previewModal = useModal();
  const [editingActivity, setEditingActivity] = useState(null);
  const [previewActivity, setPreviewActivity] = useState(null);

  // Form 实例
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // 加载活动列表
  const loadActivities = useCallback(async (page = 1, pageSize = 10, status = '', keyword = '') => {
    setLoading(true);
    try {
      const result = await getActivityList({ page, pageSize, status, keyword });
      setActivities(result.data);
      setPagination({
        current: result.page,
        pageSize: result.pageSize,
        total: result.total,
      });
    } catch (error) {
      message.error('加载活动列表失败：' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载统计信息
  const loadStats = useCallback(async () => {
    try {
      const statsData = await getActivityStats();
      setStats(statsData);
    } catch (error) {
      console.error('加载统计信息失败：', error);
    }
  }, []);

  // 初始加载和筛选/搜索变化时重新加载
  useEffect(() => {
    loadActivities(1, pagination.pageSize, selectedStatus, searchKeyword);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, searchKeyword]);

  // 组件挂载时加载统计信息
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 处理新增活动
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const activityData = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
      };
      await createActivity(activityData);
      message.success('活动创建成功！请刷新首页查看效果');
      createModal.close();
      createForm.resetFields();
      loadActivities(pagination.current, pagination.pageSize, selectedStatus, searchKeyword);
      loadStats();
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error('创建活动失败：' + error.message);
    }
  };

  // 处理编辑活动
  const handleEdit = (record) => {
    setEditingActivity(record);
    editModal.open();
  };

  // 处理更新活动
  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields();
      const activityData = {
        ...values,
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
      };
      await updateActivity(editingActivity.id, activityData);
      message.success('活动更新成功！请刷新首页查看效果');
      editModal.close();
      setEditingActivity(null);
      editForm.resetFields();
      loadActivities(pagination.current, pagination.pageSize, selectedStatus, searchKeyword);
      loadStats();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error('更新活动失败：' + error.message);
    }
  };

  // 处理删除活动
  const handleDelete = async (id) => {
    try {
      await deleteActivity(id);
      message.success('活动删除成功！请刷新首页查看效果');
      loadActivities(pagination.current, pagination.pageSize, selectedStatus, searchKeyword);
      loadStats();
    } catch (error) {
      message.error('删除活动失败：' + error.message);
    }
  };

  // 处理状态切换
  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateActivityStatus(id, newStatus);
      message.success('状态更新成功！请刷新首页查看效果');
      loadActivities(pagination.current, pagination.pageSize, selectedStatus, searchKeyword);
      loadStats();
    } catch (error) {
      message.error('状态更新失败：' + error.message);
    }
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearchKeyword(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // 处理状态筛选
  const handleStatusFilter = (value) => {
    setSelectedStatus(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // 处理预览
  const handlePreview = (record) => {
    setPreviewActivity(record);
    previewModal.open();
  };

  // 处理批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的活动');
      return;
    }
    try {
      await batchDeleteActivities(selectedRowKeys);
      message.success(`成功删除 ${selectedRowKeys.length} 个活动`);
      setSelectedRowKeys([]);
      loadActivities(pagination.current, pagination.pageSize, selectedStatus, searchKeyword);
      loadStats();
    } catch (error) {
      message.error('批量删除失败：' + error.message);
    }
  };

  // 处理批量修改状态
  const handleBatchStatusChange = async (newStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要修改的活动');
      return;
    }
    try {
      await batchUpdateActivityStatus(selectedRowKeys, newStatus);
      message.success(`成功更新 ${selectedRowKeys.length} 个活动的状态`);
      setSelectedRowKeys([]);
      loadActivities(pagination.current, pagination.pageSize, selectedStatus, searchKeyword);
      loadStats();
    } catch (error) {
      message.error('批量更新失败：' + error.message);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '活动类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const typeMap = {
          promotion: { text: '促销活动', color: 'orange' },
          reward: { text: '奖励活动', color: 'green' },
          flash_sale: { text: '限时秒杀', color: 'red' },
          event: { text: '主题活动', color: 'blue' },
          other: { text: '其他', color: 'default' },
        };
        const typeInfo = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        const statusMap = {
          active: { text: '进行中', color: 'success' },
          inactive: { text: '未开始', color: 'default' },
          ended: { text: '已结束', color: 'error' },
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return (
          <Tag
            color={statusInfo.color}
            style={{ cursor: 'pointer' }}
            onClick={() => {
              const newStatus = status === 'active' ? 'inactive' : 'active';
              handleStatusChange(record.id, newStatus);
            }}
          >
            {statusInfo.text}
          </Tag>
        );
      },
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 100,
      render: (type) => {
        const typeMap = {
          banner: { text: 'Banner', color: 'blue' },
          popup: { text: '弹窗', color: 'purple' },
          video: { text: '视频', color: 'cyan' },
          image: { text: '图片', color: 'green' },
        };
        const typeInfo = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: '投放位置',
      dataIndex: 'placement',
      key: 'placement',
      width: 120,
      render: (placement) => {
        const placementMap = {
          home_top: { text: '首页顶部', color: 'orange' },
          home_bottom: { text: '首页底部', color: 'green' },
          home_center: { text: '首页中央', color: 'purple' },
          global: { text: '全站', color: 'blue' },
        };
        const placementInfo = placementMap[placement] || { text: placement, color: 'default' };
        return <Tag color={placementInfo.color}>{placementInfo.text}</Tag>;
      },
    },
    {
      title: '显示规则',
      dataIndex: 'displayRule',
      key: 'displayRule',
      width: 140,
      render: (rule) => {
        const ruleMap = {
          first_visit: { text: '首次访问', color: 'blue' },
          every_visit: { text: '每次访问', color: 'green' },
          once_per_session: { text: '每次会话', color: 'orange' },
          always: { text: '始终显示', color: 'purple' },
        };
        const ruleInfo = ruleMap[rule] || { text: rule, color: 'default' };
        return <Tag color={ruleInfo.color}>{ruleInfo.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a, b) => a.priority - b.priority,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
            style={{ padding: '0 4px' }}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: '0 4px' }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个活动吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
              style={{ padding: '0 4px' }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理分页变化
  const handleTableChange = (newPagination) => {
    loadActivities(newPagination.current, newPagination.pageSize, selectedStatus, searchKeyword);
  };

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => ({
      disabled: false,
    }),
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <div className={cx('header')}>
          <div className={cx('header-left')}>
            <h1 className={cx('title')}>活动管理</h1>
            <p className={cx('subtitle')}>管理和配置平台活动资源</p>
          </div>
          <div className={cx('header-right')}>
            <Space>
              <Button
                icon={<HomeOutlined />}
                onClick={() => {
                  navigate(config.routes.home);
                  // 延迟刷新，确保页面已加载
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                }}
              >
                查看首页效果
              </Button>
              <Button
                icon={<LinkOutlined />}
                onClick={() => {
                  window.open(config.routes.home, '_blank');
                }}
              >
                新标签页打开首页
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadActivities(pagination.current, pagination.pageSize, selectedStatus, searchKeyword);
                  loadStats();
                }}
              >
                刷新列表
              </Button>
              <Space size="small" style={{ marginLeft: '8px' }}>
                <span style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>调试信息</span>
                <Switch
                  checked={debugInfoVisible}
                  onChange={(checked) => {
                    setDebugInfoVisible(checked);
                    localStorage.setItem('debugInfoVisible', checked.toString());
                    // 触发自定义事件，通知同标签页内的其他组件
                    window.dispatchEvent(new CustomEvent('customStorageChange', {
                      detail: { key: 'debugInfoVisible', value: checked.toString() }
                    }));
                    message.success(checked ? '已开启调试信息显示' : '已关闭调试信息显示');
                  }}
                  size="small"
                />
              </Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={createModal.open}
              >
                新增活动
              </Button>
            </Space>
          </div>
        </div>

        {/* 提示信息 */}
        <Alert
          message="💡 提示"
          description="修改活动后，请点击上方「查看首页效果」按钮或刷新首页查看 Banner 和 Popup 的更新效果。活动数据会实时更新，无需重启应用。"
          type="info"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />

        {/* 统计卡片 */}
        <Row gutter={16} className={cx('stats-row')}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总活动数" value={stats.total} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="进行中" value={stats.active} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="运行中" value={stats.running} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="未开始" value={stats.inactive} valueStyle={{ color: '#999' }} />
            </Card>
          </Col>
        </Row>

        {/* 搜索和筛选栏 */}
        <div className={cx('filter-bar')}>
          <Space size="middle" wrap>
            <Search
              placeholder="搜索活动名称或描述"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              style={{ width: 300 }}
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch('');
                }
              }}
            />
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 150 }}
              size="large"
              value={selectedStatus || undefined}
              onChange={handleStatusFilter}
            >
              <Option value="active">进行中</Option>
              <Option value="inactive">未开始</Option>
              <Option value="ended">已结束</Option>
            </Select>
            {selectedRowKeys.length > 0 && (
              <Space>
                <span className={cx('selected-count')}>已选择 {selectedRowKeys.length} 项</span>
                <Button
                  size="large"
                  onClick={() => handleBatchStatusChange('active')}
                >
                  批量启用
                </Button>
                <Button
                  size="large"
                  onClick={() => handleBatchStatusChange('inactive')}
                >
                  批量停用
                </Button>
                <Popconfirm
                  title={`确定要删除选中的 ${selectedRowKeys.length} 个活动吗？`}
                  onConfirm={handleBatchDelete}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button size="large" danger>
                    批量删除
                  </Button>
                </Popconfirm>
              </Space>
            )}
          </Space>
        </div>

        <div className={cx('content')}>
          <Table
            columns={columns}
            dataSource={activities}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            rowSelection={rowSelection}
            sticky={{ offsetHeader: 0 }}
          />
        </div>
      </div>

      {/* 新增活动弹窗 */}
      <Modal
        title="新增活动"
        open={createModal.visible}
        onOk={handleCreate}
        onCancel={() => {
          createModal.close();
          createForm.resetFields();
        }}
        okText="创建"
        cancelText="取消"
        width={800}
        destroyOnClose
      >
        <ActivityForm form={createForm} />
      </Modal>

      {/* 编辑活动弹窗 */}
      <Modal
        title="编辑活动"
        open={editModal.visible}
        onOk={handleUpdate}
        onCancel={() => {
          editModal.close();
          setEditingActivity(null);
          editForm.resetFields();
        }}
        okText="更新"
        cancelText="取消"
        width={800}
        destroyOnClose
      >
        {editingActivity && <ActivityForm form={editForm} initialValues={editingActivity} />}
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title="活动预览"
        open={previewModal.visible}
        onCancel={previewModal.close}
        footer={null}
        width={600}
        destroyOnClose
      >
        {previewActivity && (
          <div className={cx('preview-container')}>
            <div className={cx('preview-info')}>
              <p><strong>活动名称：</strong>{previewActivity.name}</p>
              <p><strong>资源类型：</strong>{previewActivity.resourceType}</p>
              <p><strong>投放位置：</strong>{previewActivity.placement}</p>
              <p><strong>显示规则：</strong>{previewActivity.displayRule}</p>
            </div>
            <div className={cx('preview-resource')}>
              <div className={cx('preview-image-wrapper')}>
                <img
                  src={previewActivity.resourceUrl}
                  alt={previewActivity.name}
                  className={cx('preview-image')}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
                <div className={cx('preview-placeholder')} style={{ display: 'none' }}>
                  <span>图片加载失败</span>
                </div>
              </div>
              {previewActivity.resourceType === 'popup' && (
                <p className={cx('preview-note')}>
                  <small>注：弹窗类型在实际页面中会以弹窗形式显示</small>
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Activity;
