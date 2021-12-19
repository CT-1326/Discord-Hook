const {Webhook, MessageBuilder} = require('discord-webhook-node'); // discord-webhook-node 라이브러리 연동
const axios = require('axios'); // axios 라이브러리 연동
const redis = require('redis'); // redis 라이브러리 연동
const client = redis.createClient(process.env.REDIS_URL); // redis의 연결 클라이언트 변수 생성
require('dotenv').config(); // 환경변수 라이브러리 연동
const hook = new Webhook(process.env.index_URL); // discord-webhook-node 라이브러리의 webhook 변수 생성

let config = {
    method: 'post',
    url: 'https://api.campuspick.com/find/activity/list?target=1&limit=10&offset=0&categ' +
            'oryId=108',
    headers: {},
    timeout: 1000
}; // 크롤링 하고자 하는 사이트의 GET 메소드 HTTP요청 환경설정

axios(config)
    .then(function (response) {
        // console.log(JSON.stringify(response.data));
        let getData = response.data.result.activities; // 크롤링 결과 값을 변수 처리
        console.log(getData);
        let check = false; // 새로운 게시물이 포함되었는지를 구분하는 Flag 값 선언
        let arr = []; // 크롤링으로 추출된 게시물 id 값 저장 배열 선언
        client.get('idKey', (err, params) => { // redis 호출 및 시작
            console.log('Redis idKey value:', params);
            for (let index = 0; index < getData.length; index++) { // 크롤링으로 추출된 게시물 개수 만큼 반복문 수행
                console.log('gongmo ID value:', getData[index].id);
                arr.push(getData[index].id); // 크롤링 게시물 id 값을 배열에 저장
                if (params.indexOf(getData[index].id) == -1) { // 현재의 게시물 id 값이 redis에 저장되지 않은 값일 경우
                    check = true; // 새로운 게시물이 있음으로 식별
                    const embed = new MessageBuilder()
                        .setTitle('새로운 공모전이 올라오다!') // 메시지 타이틀 작성
                        .setAuthor("알림봇", 'https://www.campuspick.com/favicon.ico') // 메시지 아이콘 설정
                        .setURL('https://www.campuspick.com/contest/view?id=' + getData[index].id) // 해당 게시물 주소로 연결
                        .setColor('#00b0f4') // 메시지 색상 설정
                        .setFooter('올라온 시간', 'https://www.campuspick.com/favicon.ico') // 메시지 footer 작성
                        .setTimestamp(); // 현재 메시지 작성 시간 저장
                    hook.send(embed); // 새로운 게시물 알림 메시지 전송
                } else {
                    console.log('Not today!');
                }
            }
            // console.log(check);
            if (check) { // 새로운 게시물이 있었음을 식별하였다면
                const redisValue = JSON.stringify(arr);
                client.set('idKey', redisValue); // redis의 현재 DB 상태를 저장한 게시물 id 값 배열 내용으로 갱신
            }
            client.quit(); // redis 종료
        });
    })
    .catch(function (error) {
        console.log(error);
    });