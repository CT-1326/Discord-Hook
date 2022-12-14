const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
const hook = new Webhook(process.env.GONGMO_URL); // 공모전 채널 webhook 경로 등록
const Redis = require("ioredis");
let client = new Redis(process.env.REDIS_URL);

let config = {
    method: 'post',
    url: 'https://api.campuspick.com/find/activity/list?target=1&limit=10&offset=0&categ' +
            'oryId=108',
    headers: {},
    timeout: 1000
};

module.exports = function () {
    axios(config)
        .then(function (response) {
            // console.log(JSON.stringify(response.data));
            let getData = response.data.result.activities;
            // console.log('Crawling gongmo data : ', getData);
            let check = false; // 크롤링 결과가 새로운 게시물을 포함하였는지를 확인하는 Flag 값
            let arr = [];
            /* 공모전 데이터 redis 호출 */
            client.get('gongmoData', (err, params) => {
                // console.log('Gongmo redis value :', params);
                for (let index = 0; index < getData.length; index++) {
                    // console.log('gongmo ID value:', getData[index].id);
                    arr.push(getData[index].id); // 크롤링 결과 중 게시물 id 값만 따로 배열 처리
                    /* 현재 게시물 id 값이 redis에 저장되지 않은 값일 경우 새로운 게시물로 취급하여 관련 메시지를 전송 */
                    if (params.indexOf(getData[index].id) == -1) {
                        check = true;
                        const embed = new MessageBuilder()
                            .setTitle('새로운 공모전이 올라오다!')
                            .setAuthor("알림봇", 'https://www.campuspick.com/favicon.ico')
                            .setURL('https://www.campuspick.com/contest/view?id=' + getData[index].id) // 메시지 클릭 시 해당 게시물 주소로 연결
                            .setColor('#00b0f4')
                            .setFooter('올라온 시간', 'https://www.campuspick.com/favicon.ico')
                            .setTimestamp();
                        hook.send(embed);
                    }
                }
                /* 새로운 게시물이 있었음을 식별했다면 공모전 데이터 redis 값을 따로 처리한 배열 값으로 저장 및 종료 */
                if (check === true) {
                    console.log('New gongmo redis data set!');
                    const redisValue = JSON.stringify(arr);
                    client.set('gongmoData', redisValue);
                }
                client.quit();
            });
        })
        .catch(function (err) {
            console.error(err);
        });
}
