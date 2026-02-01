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

import { useState, useEffect, useCallback } from 'react';
import { API } from '../../helpers';

const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 小时
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 忽略后 24 小时内不再提示

export const useUpdateCheck = (isAdmin = false) => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // 检查是否在忽略期内
  const isDismissed = useCallback(() => {
    const dismissedUntil = localStorage.getItem('update_dismissed_until');
    if (dismissedUntil) {
      return Date.now() < parseInt(dismissedUntil, 10);
    }
    return false;
  }, []);

  // 检查更新
  const checkUpdate = useCallback(async (force = false) => {
    if (!force && isDismissed()) {
      setDismissed(true);
      return null;
    }

    setLoading(true);
    try {
      const res = await API.get('/api/version/check');
      if (res.data.success && res.data.data) {
        setUpdateInfo(res.data.data);
        return res.data.data;
      }
    } catch (error) {
      console.error('检查更新失败:', error);
    } finally {
      setLoading(false);
    }
    return null;
  }, [isDismissed]);

  // 执行更新
  const executeUpdate = useCallback(async () => {
    if (!isAdmin) {
      return { success: false, message: '需要管理员权限' };
    }

    setUpdating(true);
    try {
      const res = await API.post('/api/admin/update');
      return res.data;
    } catch (error) {
      return { success: false, message: error.message || '更新失败' };
    } finally {
      setUpdating(false);
    }
  }, [isAdmin]);

  // 回退版本
  const rollbackUpdate = useCallback(async () => {
    if (!isAdmin) {
      return { success: false, message: '需要管理员权限' };
    }

    setUpdating(true);
    try {
      const res = await API.post('/api/admin/update/rollback');
      return res.data;
    } catch (error) {
      return { success: false, message: error.message || '回退失败' };
    } finally {
      setUpdating(false);
    }
  }, [isAdmin]);

  // 忽略本次更新
  const dismissUpdate = useCallback(() => {
    const dismissUntil = Date.now() + DISMISS_DURATION;
    localStorage.setItem('update_dismissed_until', dismissUntil.toString());
    setDismissed(true);
  }, []);

  // 初始检查
  useEffect(() => {
    checkUpdate();

    // 定时检查
    const interval = setInterval(() => {
      checkUpdate();
    }, UPDATE_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkUpdate]);

  return {
    updateInfo,
    loading,
    updating,
    dismissed,
    hasUpdate: updateInfo?.has_update && !dismissed,
    checkUpdate,
    executeUpdate,
    rollbackUpdate,
    dismissUpdate,
  };
};

export default useUpdateCheck;
