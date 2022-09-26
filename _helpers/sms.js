const
    twilio = require('twilio'),
    sid = process.env.TWILIO_SID,
    token = process.env.TWILIO_TOKEN,
    twilioPhone = process.env.TWILIO_PHONE,
    client = new twilio(sid, token);

module.exports = { send };

async function send(userToken, userPhone) {

    client.messages.create({
        body: 'Verification code for Vaya: ' + userToken,
        to: '+' + userPhone,
        from: twilioPhone
    })
};