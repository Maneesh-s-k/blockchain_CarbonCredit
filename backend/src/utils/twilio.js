const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  async sendDeviceAlert(phoneNumber, message) {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: phoneNumber
      });

      console.log('SMS sent successfully:', result.sid);
      return result;
    } catch (error) {
      console.error('Twilio SMS error:', error);
      throw error;
    }
  }

  async sendTradingAlert(phoneNumber, orderData) {
    try {
      const message = `Energy Trading Alert: Your ${orderData.orderType} order for ${orderData.energyAmount} kWh has been ${orderData.status}. Total: $${orderData.totalAmount}`;
      
      return await this.sendDeviceAlert(phoneNumber, message);
    } catch (error) {
      console.error('Trading SMS error:', error);
      throw error;
    }
  }
}

module.exports = new SMSService();
