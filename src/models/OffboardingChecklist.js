const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OffboardingChecklist = sequelize.define('OffboardingChecklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'employees', key: 'id' },
  },
  deviceReturned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  simStatusUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  accountsRevoked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  equipmentAudit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  completedBy: {
    type: DataTypes.INTEGER,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('pending', 'inprogress', 'completed'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'offboarding_checklists',
});

module.exports = OffboardingChecklist;
