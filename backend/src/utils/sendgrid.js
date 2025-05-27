const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  constructor() {
    this.fromEmail = 'noreply@energytrading.com'; // Replace with your verified sender
  }

  async sendDeviceRegistrationEmail(email, deviceData) {
    try {
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: 'Device Registration Confirmation',
        html: `
          <h2>Device Registration Successful</h2>
          <p>Your energy device has been successfully registered:</p>
          <ul>
            <li><strong>Device Name:</strong> ${deviceData.deviceName}</li>
            <li><strong>Type:</strong> ${deviceData.deviceType}</li>
            <li><strong>Capacity:</strong> ${deviceData.capacity} kW</li>
            <li><strong>Serial Number:</strong> ${deviceData.serialNumber}</li>
          </ul>
          <p>Your device is now pending verification.</p>
        `
      };

      await sgMail.send(msg);
      console.log('Device registration email sent successfully');
    } catch (error) {
      console.error('SendGrid email error:', error);
      throw error;
    }
  }

  async sendTradingNotification(email, orderData) {
    try {
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: 'Trading Order Update',
        html: `
          <h2>Trading Order ${orderData.status}</h2>
          <p>Your ${orderData.orderType} order has been ${orderData.status}:</p>
          <ul>
            <li><strong>Energy Amount:</strong> ${orderData.energyAmount} kWh</li>
            <li><strong>Price per Unit:</strong> $${orderData.pricePerUnit}</li>
            <li><strong>Total Amount:</strong> $${orderData.totalAmount}</li>
          </ul>
        `
      };

      await sgMail.send(msg);
      console.log('Trading notification email sent successfully');
    } catch (error) {
      console.error('SendGrid email error:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
