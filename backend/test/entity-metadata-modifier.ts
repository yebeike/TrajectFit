import { getMetadataArgsStorage } from 'typeorm';

/**
 * 修改所有实体中的枚举列类型为SQLite兼容类型
 */
export function modifyEntityMetadataForSqlite() {
  if (process.env.NODE_ENV !== 'test') return;

  const metadataStorage = getMetadataArgsStorage();
  
  // 修改所有列的元数据
  metadataStorage.columns.forEach(column => {
    if (column.options && column.options.type === 'enum') {
      // 保留枚举值但改变类型
      column.options.type = 'text';
    }
  });
}