const {Webhook, MessageBuilder} = require('discord-webhook-node');
const hook = new Webhook(process.env.HOTDEAL_URL); // webhook 경로 등록
const axios = require('axios');
const cheerio = require('cheerio');
const redis = require('redis');
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
}); // redis 연동

module.exports = function () {
    hook.setUsername('HotDeal Alert'); // BOT 이름 작성
    axios
        .get('https://bbs.ruliweb.com/market/board/1020', {timeout: 10}) // 해당 페이지 크롤링 연결 타임을 제한하여 무한 연결 상태 방지
        .then(async function (html) {
            // console.log(html.data);
            const $ = cheerio.load(html.data);
            const crawlingResult = {};
            /* 해당 페이지 게시물의 class 명칭을 확인해 업로드 순서의 유저 게시물만 필터링 */
            const postLength = $(
                '#board_list > div > div.board_main.theme_default > table > tbody > tr'
            ).length;
            for (let index = 1; index <= postLength; index++) {
                let postClassName = $(
                    '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                    'd(' + index + ')'
                )
                    .attr()
                    .class;
                if (postClassName === 'table_body blocktarget') {
                    /* 해당 게시물의 id, 제목 값을 추출 및 배열처리*/
                    let postID = $(
                        '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                        'd(' + index + ') > td.id'
                    )
                        .text()
                        .replace(/\s/g, '');
                    let postTitle = $(
                        '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                        'd(' + index + ') > td.subject > div > a.deco'
                    ).text();
                    crawlingResult[postID] = postTitle;
                }
            }
            /* 핫딜 데이터 컬렉션 호출 */
            await client
                .on('error', err => console.error('Redis Client Error', err))
                .connect();
            const hotDealData = await client.sMembers('hotDealData');
            /* 해당 컬렉션 존재 시 저장되지 않은 크롤링 값을 신규 게시물로 판별해 메시지 전송 및 업데이트, 미존재 시 크롤링 값 전체 저장 */
            if (hotDealData.length != 0) {
                const FilterNewData = Object
                    .keys(crawlingResult)
                    .filter(item => !hotDealData.includes(item));
                if (FilterNewData.length != 0) {
                    const newData = FilterNewData.reduce((acc, key) => {
                        acc[key] = crawlingResult[key]
                        return acc;
                    }, {});
                    for (const key in newData) {
                        const embed = new MessageBuilder()
                            .setTitle(newData[key])
                            .setAuthor(
                                "HotDeal",
                                'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                            )
                            .setURL('https://bbs.ruliweb.com/market/board/1020/read/' + key) // 메시지 클릭 시 해당 게시물 주소로 연결
                            .setColor('#181696')
                            .setTimestamp();
                        await hook.send(embed);
                    }
                    await client.del('hotDealData');
                    await client.sAdd('hotDealData', Object.keys(crawlingResult));
                    console.log('Successfully hotDealData Update!');
                }
            } else {
                await client.sAdd('hotDealData', Object.keys(crawlingResult));
                console.log('Successfully hotDealData Setup!');
            }
            await client.disconnect();
        })
        .catch(function (err) {
            console.error('From hotDeal:', err.message);
            if (err.message.indexOf("timeout") !== 0) {
                const embed = new MessageBuilder()
                    .setTitle('핫딜 알림에 문제가 발생하였습니다.')
                    .setAuthor(
                        "알림봇",
                        'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                    )
                    .setColor('#FF0000')
                    .setTimestamp();
                hook.send(embed);
            }
        });
}