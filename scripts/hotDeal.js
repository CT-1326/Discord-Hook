const {Webhook, MessageBuilder} = require('discord-webhook-node');
require('dotenv').config()
const axios = require('axios');
const cheerio = require('cheerio');
const hook = new Webhook(process.env.HOTDEAL_URL); // discord-webhook-node 라이브러리의 핫딜 채널 webhook 변수
const Redis = require("ioredis");
let client = new Redis(process.env.REDIS_URL);

module.exports = function () {
    axios
        .get('https://bbs.ruliweb.com/market/board/1020', {timeout: 3000}) // 해당 페이지 크롤링 연결 값을 제한하여 무한 연결 상태 방지
        .then(function (html) {
            // console.log(html.data);
            const $ = cheerio.load(html.data);
            const arr = [];
            let check = false; /// 크롤링 결과가 새로운 게시물을 포함하였는지를 확인하는 Flag 값
            client.get('hotdealData', (err, params) => { // 핫딜 관련 redis 호출 및 시작
                // console.log('Hotdeal redis value:', params);
                /* 크롤링된 게시판의 게시물 개수만큼 작업을 수행 */
                const tableLength = $(
                    '#board_list > div > div.board_main.theme_default > table > tbody > tr'
                ).length;
                // console.log('Crawling hotdeal data length : ', tableLength);
                for (let index = 1; index <= tableLength; index++) {
                    /* 해당 게시물의 class 명칭을 확인해 유저들의 업로드 순으로 배치되는 게시물의 class 명칭인지를 판독 */
                    let tableName = $(
                        '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                        'd(' + index + ')'
                    )
                        .attr()
                        .class;
                    // console.log(tableName);
                    if (tableName === 'table_body blocktarget') {
                        /* 해당 게시물의 id 값을 추출해 redis에 저장되지 않은 값일 경우 새로운 게시물로 취급하여 관련 메시지를 전송 */
                        let checkID = $(
                            '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                            'd(' + index + ') > td.id'
                        )
                            .text()
                            .replace(/\s/g, '');
                        // console.log('Hotdeal ID value:', checkID);
                        arr.push(checkID);
                        if (params.indexOf(checkID) == -1) {
                            check = true;
                            const title = $(
                                '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                                'd(' + index + ') > td.subject > div > a.deco'
                            ).text(); // 게시물의 제목 내용을 추출해 메시지 내용으로 활용
                            // console.log(title);
                            const embed = new MessageBuilder()
                                .setTitle(title)
                                .setAuthor(
                                    "알림봇",
                                    'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                                )
                                .setURL('https://bbs.ruliweb.com/market/board/1020/read/' + checkID) // 메시지 클릭 시 해당 게시물 주소로 연결
                                .setColor('#181696')
                                .setFooter(
                                    '올라온 시간',
                                    'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                                )
                                .setTimestamp();
                            hook.send(embed);
                        }
                    }
                }

                /* 새로운 게시물이 있었음을 식별했다면 공모전 관련 redis 값을 새로운 배열 값으로 저장 및 종료 */
                if (check === true) {
                    console.log('New hotdeal redis data set!');
                    const redisValue = JSON.stringify(arr);
                    client.set('hotdealData', redisValue);
                }
                client.quit();
            });
        })
        .catch(function (err) {
            console.error(err);
        });
}