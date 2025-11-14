import { useEffect } from 'react';
import { Form, Input, Select, DatePicker, InputNumber } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

/**
 * 活动表单组件
 * @param {Object} form - Ant Design Form 实例
 * @param {Object} initialValues - 初始值（编辑时使用）
 */
function ActivityForm({ form, initialValues }) {
  useEffect(() => {
    if (initialValues) {
      // 转换日期格式
      const formattedValues = {
        ...initialValues,
        startDate: initialValues.startDate ? dayjs(initialValues.startDate) : null,
        endDate: initialValues.endDate ? dayjs(initialValues.endDate) : null,
      };
      form.setFieldsValue(formattedValues);
    } else {
      form.resetFields();
    }
  }, [form, initialValues]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        status: 'inactive',
        priority: 1,
        resourceType: 'banner',
        placement: 'home_top',
        displayRule: 'first_visit',
      }}
    >
      <Form.Item
        name="name"
        label="活动名称"
        rules={[{ required: true, message: '请输入活动名称' }]}
      >
        <Input placeholder="请输入活动名称" />
      </Form.Item>

      <Form.Item
        name="type"
        label="活动类型"
        rules={[{ required: true, message: '请选择活动类型' }]}
      >
        <Select placeholder="请选择活动类型">
          <Option value="promotion">促销活动</Option>
          <Option value="reward">奖励活动</Option>
          <Option value="flash_sale">限时秒杀</Option>
          <Option value="event">主题活动</Option>
          <Option value="other">其他</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="status"
        label="活动状态"
        rules={[{ required: true, message: '请选择活动状态' }]}
      >
        <Select placeholder="请选择活动状态">
          <Option value="active">进行中</Option>
          <Option value="inactive">未开始</Option>
          <Option value="ended">已结束</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="startDate"
        label="开始日期"
        rules={[{ required: true, message: '请选择开始日期' }]}
      >
        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item
        name="endDate"
        label="结束日期"
        rules={[
          { required: true, message: '请选择结束日期' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || !getFieldValue('startDate')) {
                return Promise.resolve();
              }
              if (value.isBefore(getFieldValue('startDate'))) {
                return Promise.reject(new Error('结束日期不能早于开始日期'));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item
        name="description"
        label="活动描述"
        rules={[{ required: true, message: '请输入活动描述' }]}
      >
        <TextArea rows={4} placeholder="请输入活动描述" />
      </Form.Item>

      <Form.Item
        name="resourceType"
        label="资源类型"
        rules={[{ required: true, message: '请选择资源类型' }]}
      >
        <Select placeholder="请选择资源类型">
          <Option value="banner">Banner</Option>
          <Option value="popup">弹窗</Option>
          <Option value="video">视频</Option>
          <Option value="image">图片</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="resourceUrl"
        label="资源URL"
        rules={[
          { required: true, message: '请输入资源URL' },
          { type: 'url', message: '请输入有效的URL' },
        ]}
      >
        <Input placeholder="https://example.com/resource.jpg" />
      </Form.Item>

      <Form.Item
        name="targetUrl"
        label="跳转链接"
        rules={[{ required: true, message: '请输入跳转链接' }]}
        tooltip="支持相对路径（如 /activity/xxx）或绝对URL（如 https://example.com）"
      >
        <Input placeholder="/activity/xxx 或 https://example.com" />
      </Form.Item>

      <Form.Item
        name="placement"
        label="投放位置"
        rules={[{ required: true, message: '请选择投放位置' }]}
        tooltip="选择资源在页面中的显示位置"
      >
        <Select placeholder="请选择投放位置">
          <Option value="home_top">首页顶部</Option>
          <Option value="home_bottom">首页底部</Option>
          <Option value="home_center">首页中央</Option>
          <Option value="global">全站</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="displayRule"
        label="显示规则"
        rules={[{ required: true, message: '请选择显示规则' }]}
        tooltip="控制资源的显示时机"
      >
        <Select placeholder="请选择显示规则">
          <Option value="first_visit">首次访问显示</Option>
          <Option value="every_visit">每次访问都显示</Option>
          <Option value="once_per_session">每次会话显示一次</Option>
          <Option value="always">始终显示（关闭后可再次显示）</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="priority"
        label="优先级"
        rules={[{ required: true, message: '请输入优先级' }]}
        tooltip="数字越小优先级越高，相同位置按优先级显示"
      >
        <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="数字越小优先级越高" />
      </Form.Item>
    </Form>
  );
}

export default ActivityForm;

