const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL); // redis의 연결 클라이언트 변수 생성
require('dotenv').config(); // 환경변수 라이브러리 연동 (Heroku에 등록된 환경변수)
const hook = new Webhook(process.env.index_URL); // discord-webhook-node 라이브러리의 webhook 변수 생성

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
        console.log('Crawling gongmo data : ', getData);
        let check = false; // 크롤링 결과가 새로운 게시물을 포함하였는지를 확인하는 Flag 값
        let arr = [];
        client.get('idKey', (err, params) => { // 공모전 알림 관련 redis 호출 및 시작
            console.log('Gongmo redis value:', params);
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
                } else {
                    console.log('Not today!');
                }
            }
            /* 새로운 게시물이 있었음을 식별했다면 공모전 관련 redis 값을 새로운 배열 값으로 저장 및 종료 */
            if (check === true) {
                console.log('New gongmo redis data set!');
                const redisValue = JSON.stringify(arr);
                client.set('idKey', redisValue);
            }
            client.quit();
        });
    })
    .catch(function (err) {
        console.error(err);
    });