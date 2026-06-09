const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assetTag: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.ENUM('phone', 'tablet', 'sim', 'router', 'laptop', 'other'),
    allowNull: false,
  },
  brand: {
    type: DataTypes.STRING(100),
  },
  model: {
    type: DataTypes.STRING(100),
  },
  serialNumber: {
    type: DataTypes.STRING(200),
  },
  imei: {
    type: DataTypes.STRING(50),
  },
  simNumber: {
    type: DataTypes.STRING(50),
  },
  phoneNumber: {
    type: DataTypes.STRING(50),
  },
  status: {
    type: DataTypes.ENUM('available', 'assigned', 'maintenance', 'retired'),
    defaultValue: 'available',
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    references: { model: 'employees', key: 'id' },
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(100),
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
  },
  purchasePrice: {
    type: DataTypes.DECIMAL(12, 2),
  },
  warrantyExpiry: {
    type: DataTypes.DATEONLY,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  createdBy: {
    type: DataTypes.INTEGER,
  },
  updatedBy: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'assets',
});

module.exports = Asset;
