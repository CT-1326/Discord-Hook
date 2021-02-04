const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
require('date-utils');
const hook = new Webhook(
    "https://discord.com/api/webhooks/800281509335400448/YphrCNb2ocEfbim9Hn1Jl4ei4M" +
    "T5xGzGoxhiFGE3Lw0YdkB4B9ELo3iVtfNHbdIYWBmG"
);

let config = {
    method: 'post',
    url: 'https://api.campuspick.com/find/activity/list?target=1&limit=10&offset=0&categ' +
            'oryId=108',
    headers: {}
};

axios(config)
    .then(function (response) {
        // console.log(JSON.stringify(response.data)); console.log(getData);
        let getData = response.data.result.activities;
        for (let index = 0; index < getData.length; index++) {
            // console.log(getData[index].image);
            axios
                .get(getData[index].image)
                .then(img => {
                    const imgDate = img.headers['last-modified'];
                    // console.log(imgDate);
                    const today = new Date().toFormat('DDD, DD MMM YYYY');
                    // console.log(today);
                    if (imgDate.indexOf(today) != -1) {
                        const embed = new MessageBuilder()
                            .setTitle('새로운 공모전이 올라오다!')
                            .setAuthor("알림봇", 'https://www.campuspick.com/favicon.ico')
                            .setURL('https://www.campuspick.com/contest?category=108')
                            .setColor('#00b0f4')
                            .setFooter('올라온 시간', 'https://www.campuspick.com/favicon.ico')
                            .setTimestamp();

                        hook.send(embed);
                    } else {
                        console.log('Not today!');
                    }
                });
        }
    })
    .catch(function (error) {
        console.log(error);
    });