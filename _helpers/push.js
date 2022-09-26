const { Expo } = require('expo-server-sdk');

let expo = new Expo();

module.exports = { 
    send,
    sendBulk
};

async function send(pushToken, dataParams) {

    let messages = [];

    if (!Expo.isExpoPushToken(pushToken)) {
        throw `Push token ${pushToken} is not a valid Expo push token`;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
        to: pushToken,
        sound: 'default',
        title: 'New message from ' + dataParams.sender_name,
        body: dataParams.body_message,
        data: dataParams
    })

    let ticket = await expo.sendPushNotificationsAsync(messages);

    return ticket;

}

async function sendBulk(somePushTokens, savedEvent) {

    // Create the messages that you want to send to clients
    let messages = [];
    for (let pushToken of somePushTokens) {
        // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

        // Check that all your push tokens appear to be valid Expo push tokens
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }

        // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
        messages.push({
            to: pushToken,
            sound: 'default',
            title: 'VayaApp',
            body: `There's a new event near you!`,
            data: savedEvent
        })
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    (async () => {
        // Send the chunks to the Expo push notification service. There are
        // different strategies you could use. A simple one is to send one chunk at a
        // time, which nicely spreads the load out over time:
        for (let chunk of chunks) {
            try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                tickets.push(...ticketChunk);
                // NOTE: If a ticket contains an error code in ticket.details.error, you
                // must handle it appropriately. The error codes are listed in the Expo
                // documentation:
                // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
            } catch (error) {
                console.error(error);
            }
        }
    })();

    return tickets;

}