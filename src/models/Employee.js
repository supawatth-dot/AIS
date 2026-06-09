const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING(50),
  },
  department: {
    type: DataTypes.STRING(100),
  },
  position: {
    type: DataTypes.STRING(100),
  },
  status: {
    type: DataTypes.ENUM('active', 'resigned', 'terminated'),
    defaultValue: 'active',
  },
  resignedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
  },
}, {
  tableName: 'employees',
});

module.exports = Employee;
