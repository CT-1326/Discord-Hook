const {Webhook, MessageBuilder} = require('discord-webhook-node');
const hook = new Webhook(process.env.DRUG_URL); // webhook 경로 등록

module.exports = async function () {
    try {
        hook.setUsername('Drug Alert'); // BOT 이름 작성
        /* 메시지 내용 작성 */
        const embed = new MessageBuilder()
            .setTitle('약 먹자')
            .setColor('#FF0000')
            .setTimestamp(); // 지정된 시간에 메시지가 도착하였는지를 확인하기 위한 시간대 출력
        await hook.send(embed); // 메시지 전송
        console.log('Successfully send drug alert!');
    } catch (error) {
        console.error('From drug alert : ', error);
    }
}