const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
require('dotenv').config();
const hook = new Webhook(
    process.env.index_URL
);

let config = {
    method: 'post',
    url: 'https://api.campuspick.com/find/activity/list?target=1&limit=10&offset=0&categ' +
            'oryId=108',
    headers: {},
    timeout: 1000
};

axios(config)
    .then(function (response) {
        // console.log(JSON.stringify(response.data));
        let getData = response.data.result.activities;
        console.log(getData);
        let check = false;
        let arr = [];
        client.get('idKey', (err, params) => {
            console.log('Redis idKey value:', params);
            for (let index = 0; index < getData.length; index++) {
                console.log('gongmo ID value:', getData[index].id);
                arr.push(getData[index].id);
                if (params.indexOf(getData[index].id) == -1) {
                    check = true;
                    const embed = new MessageBuilder()
                        .setTitle('새로운 공모전이 올라오다!')
                        .setAuthor("알림봇", 'https://www.campuspick.com/favicon.ico')
                        .setURL('https://www.campuspick.com/contest/view?id=' + getData[index].id)
                        .setColor('#00b0f4')
                        .setFooter('올라온 시간', 'https://www.campuspick.com/favicon.ico')
                        .setTimestamp();
                    hook.send(embed);
                } else {
                    console.log('Not today!');
                }
            }
            // console.log(check);
            if (check) {
                const redisValue = JSON.stringify(arr);
                client.set('idKey', redisValue);
            }
            client.quit();
        });
    })
    .catch(function (error) {
        console.log(error);
    });