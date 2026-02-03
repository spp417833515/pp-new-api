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

import React from 'react';
import { Table } from '@douyinfe/semi-ui';
import { FIXED_COLUMN_BG } from '../../../helpers';

/**
 * ThemedTable - 主题化表格组件
 * 自动为固定列添加深空灰背景色，覆盖 Semi-UI 默认黑色
 */
const ThemedTable = ({ columns = [], ...props }) => {
  // 为固定列添加背景色
  const processedColumns = columns.map((col) => {
    if (col.fixed) {
      return {
        ...col,
        onCell: (record, index) => {
          const originalOnCell = col.onCell ? col.onCell(record, index) : {};
          return {
            ...originalOnCell,
            style: {
              ...originalOnCell?.style,
              background: FIXED_COLUMN_BG,
            },
          };
        },
        onHeaderCell: (column) => {
          const originalOnHeaderCell = col.onHeaderCell ? col.onHeaderCell(column) : {};
          return {
            ...originalOnHeaderCell,
            style: {
              ...originalOnHeaderCell?.style,
              background: FIXED_COLUMN_BG,
            },
          };
        },
      };
    }
    return col;
  });

  return <Table columns={processedColumns} {...props} />;
};

export default ThemedTable;
