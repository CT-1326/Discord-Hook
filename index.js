const { Webhook } = require('discord-webhook-node');
const hook = new Webhook("YOUR WEBHOOK URL");

const IMAGE_URL = 'https://homepages.cae.wisc.edu/~ece533/images/airplane.png';
hook.setUsername('Discord Webhook Node Name');
hook.setAvatar(IMAGE_URL);

hook.send("Hello there!");