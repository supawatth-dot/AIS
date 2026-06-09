const sequelize = require('../config/database');
const User = require('./User');
const Asset = require('./Asset');
const Employee = require('./Employee');
const Contract = require('./Contract');
const AuditLog = require('./AuditLog');
const OffboardingChecklist = require('./OffboardingChecklist');
const bcrypt = require('bcryptjs');

// Associations
Asset.belongsTo(Employee, { foreignKey: 'assignedTo', as: 'assignedEmployee' });
Employee.hasMany(Asset, { foreignKey: 'assignedTo', as: 'assets' });

Contract.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });
Asset.hasMany(Contract, { foreignKey: 'assetId', as: 'contracts' });

OffboardingChecklist.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
Employee.hasOne(OffboardingChecklist, { foreignKey: 'employeeId', as: 'offboardingChecklist' });

AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const syncAndSeed = async () => {
  await sequelize.sync({ alter: true });

  // Seed default superadmin if no users exist
  const count = await User.count();
  if (count === 0) {
    await User.create({
      username: 'admin',
      email: 'admin@ais.local',
      password: 'Admin@123',
      role: 'superadmin',
      isActive: true,
    });
    console.log('Default superadmin created: admin@ais.local / Admin@123');
  }
};

module.exports = {
  sequelize,
  User,
  Asset,
  Employee,
  Contract,
  AuditLog,
  OffboardingChecklist,
  syncAndSeed,
};
