const {Webhook, MessageBuilder} = require('discord-webhook-node');
const hook = new Webhook(process.env.drug_URL);

hook.setUsername('Drug BOT');
const embed = new MessageBuilder()
    .setTitle('약 먹자')
    .setColor('#FF0000')
    .setTimestamp();
hook.send(embed);