import { useState, useCallback } from 'react';

/**
 * 通用弹窗 Hook
 * 用于管理弹窗的显示/隐藏状态
 * 
 * @returns {Object} { visible, open, close, toggle }
 * @example
 * const { visible, open, close } = useModal();
 * 
 * <Button onClick={open}>打开弹窗</Button>
 * <Modal visible={visible} onCancel={close}>
 *   内容
 * </Modal>
 */
function useModal(initialVisible = false) {
  const [visible, setVisible] = useState(initialVisible);

  const open = useCallback(() => {
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const toggle = useCallback(() => {
    setVisible((prev) => !prev);
  }, []);

  return {
    visible,
    open,
    close,
    toggle,
  };
}

export default useModal;

