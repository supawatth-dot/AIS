const transporter = require('../config/email');
require('dotenv').config();

const FROM = process.env.SMTP_FROM || 'AIS System <noreply@ais.local>';

const sendOffboardingAlert = async (employee, manager) => {
  try {
    const fullName = `${employee.firstName} ${employee.lastName}`;
    const managerEmail = manager ? manager.email : process.env.SMTP_USER;
    if (!managerEmail) return;

    await transporter.sendMail({
      from: FROM,
      to: managerEmail,
      subject: `[AIS] Employee Offboarding: ${fullName}`,
      html: `
        <h2>Employee Offboarding Notification</h2>
        <p>The following employee has been marked for offboarding:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${fullName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Employee ID</strong></td><td style="padding:8px;border:1px solid #ddd">${employee.employeeId}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Department</strong></td><td style="padding:8px;border:1px solid #ddd">${employee.department || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Position</strong></td><td style="padding:8px;border:1px solid #ddd">${employee.position || 'N/A'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Resigned At</strong></td><td style="padding:8px;border:1px solid #ddd">${employee.resignedAt ? new Date(employee.resignedAt).toLocaleDateString() : 'N/A'}</td></tr>
        </table>
        <p>Please complete the offboarding checklist in the AIS system.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Go to AIS System</a></p>
      `,
    });
  } catch (err) {
    console.error('Email sendOffboardingAlert error:', err.message);
  }
};

const sendContractExpiryAlert = async (contract) => {
  try {
    const to = process.env.SMTP_USER;
    if (!to) return;

    const daysLeft = Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24));

    await transporter.sendMail({
      from: FROM,
      to,
      subject: `[AIS] Contract Expiring Soon: ${contract.contractNumber}`,
      html: `
        <h2>Contract Expiry Alert</h2>
        <p>The following contract is expiring in <strong>${daysLeft} days</strong>:</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Contract #</strong></td><td style="padding:8px;border:1px solid #ddd">${contract.contractNumber}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Provider</strong></td><td style="padding:8px;border:1px solid #ddd">${contract.provider}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Type</strong></td><td style="padding:8px;border:1px solid #ddd">${contract.type}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>End Date</strong></td><td style="padding:8px;border:1px solid #ddd">${contract.endDate}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Monthly Rate</strong></td><td style="padding:8px;border:1px solid #ddd">${contract.monthlyRate ? '฿' + Number(contract.monthlyRate).toLocaleString() : 'N/A'}</td></tr>
        </table>
        <p>Please take action to renew or terminate this contract.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Go to AIS System</a></p>
      `,
    });
  } catch (err) {
    console.error('Email sendContractExpiryAlert error:', err.message);
  }
};

const sendWelcomeEmail = async (user) => {
  try {
    if (!user.email) return;

    await transporter.sendMail({
      from: FROM,
      to: user.email,
      subject: '[AIS] Welcome to the Asset Management System',
      html: `
        <h2>Welcome to AIS</h2>
        <p>Hello <strong>${user.username}</strong>,</p>
        <p>Your account has been created in the AIS Telecom & Mobile Asset Management System.</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Username</strong></td><td style="padding:8px;border:1px solid #ddd">${user.username}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd"><strong>Role</strong></td><td style="padding:8px;border:1px solid #ddd">${user.role}</td></tr>
        </table>
        <p>Please login and change your password at your earliest convenience.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Login to AIS System</a></p>
      `,
    });
  } catch (err) {
    console.error('Email sendWelcomeEmail error:', err.message);
  }
};

module.exports = { sendOffboardingAlert, sendContractExpiryAlert, sendWelcomeEmail };
