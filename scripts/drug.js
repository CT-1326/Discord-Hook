const {Webhook, MessageBuilder} = require('discord-webhook-node');
const hook = new Webhook(process.env.DRUG_URL); // 약 채널 webhook 경로 등록

module.exports = function () {
    hook.setUsername('Drug BOT');
    const embed = new MessageBuilder()
        .setTitle('약 먹자')
        .setColor('#FF0000')
        .setTimestamp(); // 지정된 시간에 메시지가 도착하였는지를 확인하기 위한 시간대 출력
    hook.send(embed);
}