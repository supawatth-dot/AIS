const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entity: {
    type: DataTypes.ENUM('asset', 'employee', 'contract', 'user'),
    allowNull: false,
  },
  entityId: {
    type: DataTypes.INTEGER,
  },
  userId: {
    type: DataTypes.INTEGER,
  },
  userName: {
    type: DataTypes.STRING(200),
  },
  oldValues: {
    type: DataTypes.TEXT,
    get() {
      const val = this.getDataValue('oldValues');
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    },
    set(val) {
      this.setDataValue('oldValues', val ? JSON.stringify(val) : null);
    },
  },
  newValues: {
    type: DataTypes.TEXT,
    get() {
      const val = this.getDataValue('newValues');
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    },
    set(val) {
      this.setDataValue('newValues', val ? JSON.stringify(val) : null);
    },
  },
  ipAddress: {
    type: DataTypes.STRING(50),
  },
}, {
  tableName: 'audit_logs',
  updatedAt: false,
});

module.exports = AuditLog;
