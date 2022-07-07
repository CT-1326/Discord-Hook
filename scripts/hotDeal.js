const {Webhook, MessageBuilder} = require('discord-webhook-node'); // discord-webhook-node 라이브러리 연동
const axios = require('axios'); // axios 라이브러리 연동
const cheerio = require('cheerio'); // cheerio 라이브러리 연동
const redis = require('redis'); // redis 라이브러리 연동
const client = redis.createClient(process.env.REDIS_URL); // redis의 연결 클라이언트 변수 생성
require('dotenv').config(); // 환경변수 라이브러리 연동
const hook = new Webhook(process.env.hotDeal_URL); // discord-webhook-node 라이브러리의 webhook 변수 생성

axios
    .get('https://bbs.ruliweb.com/market/board/1020', {timeout: 3000}) // 해당 페이지 크롤링 시도
    .then(function (html) {
        // console.log(html.data);
        const $ = cheerio.load(html.data); // 크롤링 결과 값을 하나의 변수로 처리 및 활용
        const arr = []; // 크롤링으로 추출된 게시물 id 값 저장 배열 선언
        let check = false; // 새로운 게시물이 포함되었는지를 구분하는 Flag 값 선언
        client.get('lastID', (err, params) => { // redis 호출 및 시작
            console.log('Hotdeal redis value:', params);
            const tableLength = $(
                '#board_list > div > div.board_main.theme_default > table > tbody > tr'
            ).length; // 크롤링된 게시판의 게시물 개수를 저장
            console.log('Crawling hotdeal data length : ', tableLength);
            for (let index = 1; index <= tableLength; index++) { // 개수 만큼 반복문 수행
                let tableName = $(
                    '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                    'd(' + index + ')'
                )
                    .attr()
                    .class; // 게시물의 class 명칭을 저장
                if (tableName == 'table_body') { // 해당 명칭이 업로드 순으로 배치되는 게시물의 class 명칭일 경우
                    let checkID = $(
                        '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                        'd(' + index + ') > td.id'
                    )
                        .text()
                        .replace(/\s/g, ''); // 게시물의 id 값을 추출
                    console.log('Hotdeal ID value:', checkID);
                    arr.push(checkID); // 배열에 저장
                    if (params.indexOf(checkID) == -1) { // 해당 id 값이 redis에 저장되지 않은 값일 경우
                        check = true; // 새로운 게시물이 있음으로 식별
                        const title = $(
                            '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                            'd(' + index + ') > td.subject > div > a.deco'
                        ).text(); // 게시물의 타이틀 내용을 추출
                        // console.log(title);
                        const embed = new MessageBuilder()
                            .setTitle(title) // 메시지 타이틀 작성
                            .setAuthor(
                                "알림봇",
                                'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                            ) // 메시지 아이콘 설정
                            .setURL('https://bbs.ruliweb.com/market/board/1020/read/' + checkID) // 해당 게시물 주소로 연결
                            .setColor('#181696') // 메시지 색상 설정
                            .setFooter(
                                '올라온 시간',
                                'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                            ) // 메시지 footer 작성
                            .setTimestamp(); // 현재 메시지 작성 시간 저장
                        hook.send(embed); // 새로운 게시물 알림 메시지 전송
                    }
                }
            }
            // console.log(arr);
            if (check === true) { // 새로운 게시물이 있었음을 식별하였다면
                console.log('New hotdeal redis data set!');
                const redisValue = JSON.stringify(arr);
                client.set('lastID', redisValue); // redis의 현재 DB 상태를 저장한 게시물 id 값 배열 내용으로 갱신
            }
            client.quit(); // redis 종료
        });
    })
    .catch(function (err) {
        console.error(err);
    });