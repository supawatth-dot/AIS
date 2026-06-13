const { Op } = require('sequelize');
const logger = require('../config/logger');
const { sendContractExpiryAlert } = require('./emailService');

// Run contract expiry checks - call this on a schedule (e.g. daily via setInterval or node-cron)
const checkContractExpiry = async () => {
  try {
    const { Contract } = require('../models');
    const today = new Date();
    const alertDays = [30, 7];

    for (const days of alertDays) {
      const target = new Date();
      target.setDate(target.getDate() + days);
      const dateStr = target.toISOString().split('T')[0];

      const contracts = await Contract.findAll({
        where: {
          endDate: dateStr,
          status: { [Op.ne]: 'expired' },
        },
      });

      for (const contract of contracts) {
        logger.info(`Sending expiry alert for contract ${contract.contractNumber} (${days} days left)`);
        await sendContractExpiryAlert(contract);
      }
    }
  } catch (err) {
    logger.error('Contract expiry cron error:', err);
  }
};

// Auto-expire contracts whose endDate has passed
const autoExpireContracts = async () => {
  try {
    const { Contract } = require('../models');
    const today = new Date().toISOString().split('T')[0];

    const [count] = await Contract.update(
      { status: 'expired' },
      {
        where: {
          endDate: { [Op.lt]: today },
          status: { [Op.ne]: 'expired' },
        },
      }
    );

    if (count > 0) {
      logger.info(`Auto-expired ${count} contracts`);
    }
  } catch (err) {
    logger.error('Auto-expire contracts error:', err);
  }
};

const startCronJobs = () => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Run immediately on startup, then daily
  checkContractExpiry();
  autoExpireContracts();

  setInterval(checkContractExpiry, TWENTY_FOUR_HOURS);
  setInterval(autoExpireContracts, TWENTY_FOUR_HOURS);

  logger.info('Cron jobs started (contract expiry check: daily)');
};

module.exports = { startCronJobs, checkContractExpiry, autoExpireContracts };
