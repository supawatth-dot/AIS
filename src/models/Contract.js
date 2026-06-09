const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contract = sequelize.define('Contract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  contractNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  provider: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('mobile', 'internet', 'cloud', 'hardware'),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
  },
  endDate: {
    type: DataTypes.DATEONLY,
  },
  monthlyRate: {
    type: DataTypes.DECIMAL(12, 2),
  },
  annualRate: {
    type: DataTypes.DECIMAL(12, 2),
  },
  status: {
    type: DataTypes.ENUM('active', 'expiring', 'expired'),
    defaultValue: 'active',
  },
  notes: {
    type: DataTypes.TEXT,
  },
  assetId: {
    type: DataTypes.INTEGER,
    references: { model: 'assets', key: 'id' },
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'contracts',
});

module.exports = Contract;
