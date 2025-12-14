const twilio = require("twilio");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

const client = twilio(accountSid, authToken);

async function sendSMS(to, body) {
  try {
    if (!to) throw new Error("Recipient mobile number is required");

    const cleanedNumber = to.replace(/\D/g, "");

    const formattedNumber = cleanedNumber.startsWith("91")
      ? `+${cleanedNumber}`
      : `+91${cleanedNumber}`;

    const message = await client.messages.create({
      body: `Sanghsetu Indore\n\n${body}`,
      messagingServiceSid,
      to: formattedNumber,
    });

    console.log("SMS sent successfully:", message.sid);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error("Twilio SMS Error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = sendSMS;
