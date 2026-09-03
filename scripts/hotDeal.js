const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
const cheerio = require('cheerio');
const redis = require('redis');
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
}); // redis 연동
const hook = new Webhook(process.env.HOTDEAL_URL); // webhook 경로 등록
hook.setUsername('HotDeal Alert'); // BOT 이름 작성

/* 핫딜 데이터 컬렉션 호출 */
client.on('error', err => console.error('Redis Client Error', err));
(async () => {
    await client.connect();
})();


async function R_hotDeal() {
    try {
        const html = await axios.get('https://bbs.ruliweb.com/market/board/1020', {timeout: 3000}); // 핫딜 페이지 스크래핑 연결 타임을 제한하여 무한 연결 상태 방지
        const $ = cheerio.load(html.data);
        const crawlingResult = {};
        /* 해당 페이지 게시물의 class 명칭을 확인해 업로드 순서의 유저 게시물만 필터링 */
        const postLength = $('#board_list > div > div.board_main.theme_default > table > tbody > tr').length;
        for (let index = 1; index <= postLength; index++) {
            let postClassName = $('#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                'd(' + index + ')').attr().class;
            if (postClassName === 'table_body blocktarget') {
                /* 해당 게시물의 id, 제목 값 파싱처리 */
                let postID = $('#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                    'd(' + index + ') > td.id').text().replace(/\s/g, '');
                let postTitle = $('#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                    'd(' + index + ') > td.subject > div > a.deco').contents().filter((_, el) => el.type === 'text').text().trim();
                crawlingResult[postID] = postTitle;
            }
        }
        const hotDealData = await client.sMembers('hotDealData');
        /* 해당 컬렉션 존재 시 저장되지 않은 스크래핑 값을 신규 게시물로 판별해 메시지 전송 및 업데이트 */
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
        } else { /* 컬렉션이 존재하지 않을 경우 스크래핑 값 전체 저장 */
            await client.sAdd('hotDealData', Object.keys(crawlingResult));
            console.log('Successfully hotDealData Setup!');
        }
    } catch (err) {
        console.error('From R_hotDeal:', err.message);
        if (err.message.indexOf("timeout") !== 0) {
            const embed = new MessageBuilder()
                .setTitle('핫딜 알림에 문제가 발생하였습니다.')
                .setAuthor(
                    "에러 알림",
                    'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                )
                .setColor('#FF0000')
                .setTimestamp();
            hook.send(embed);
        }
    }
}

async function Q_hotDeal() {
    try {
        const html = await axios.get('https://quasarzone.com/bbs/qb_saleinfo', {
            timeout: 3000,
            headers: { // 웹사이트에서 봇으로 인식하여 차단하는 경우를 방지하기 위해 브라우저에서 요청하는 것처럼 헤더를 설정
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                'Referer': 'https://quasarzone.com/',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });
        const $ = cheerio.load(html.data);
        const crawlingResult = {};

        /* 기본 테이블 내부의 행을 시도 */
        let rows = $('#frmSearch .list-board-wrap table tbody tr');
        if (!rows.length) rows = $('table.market-type-list tbody tr');
        if (!rows.length) rows = $('.list-board-wrap table tbody tr');

        if (rows.length) {
            rows.each((_, el) => {
                const $el = $(el);
                let a = $el.find('td:nth-child(2) a').first();
                if (!a.length) a = $el.find('a[href*="/bbs/qb_saleinfo/"]').first();
                const href = a.attr('href') || '';
                const postID = href.split('/').pop() || null;
                const postTitle = a.find('span').text().trim() || a.text().trim() || $el.text().trim();
                if (postID) crawlingResult[postID] = postTitle;
            });
        } else {
            /* 테이블 기반으로 수집하지 못한 경우 페이지 전체를 스캔하여 게시물 링크 패턴으로 대체 수집 */
            $('a[href*="/bbs/qb_saleinfo/views/"]').each((_, aEl) => {
                const a = $(aEl);
                const href = a.attr('href') || '';
                const id = href.split('/').pop() || null;
                const title = a.find('span').text().trim() || a.text().trim();
                if (id) crawlingResult[id] = title;
            });
        }

        const qHotDealData = await client.sMembers('qHotDealData');
        if (qHotDealData.length != 0) {
            const FilterNewData = Object.keys(crawlingResult).filter(item => !qHotDealData.includes(item));
            if (FilterNewData.length != 0) {
                const newData = FilterNewData.reduce((acc, key) => { acc[key] = crawlingResult[key]; return acc; }, {});
                for (const key in newData) {
                    const embed = new MessageBuilder()
                        .setTitle(newData[key])
                        .setAuthor("HotDeal", 'https://img2.quasarzone.com/level/c5449a659000c04b0c54f45a023a1d97.png')
                        .setURL('https://quasarzone.com/bbs/qb_saleinfo/views/' + key)
                        .setColor('#181696')
                        .setTimestamp();
                    await hook.send(embed);
                }
                await client.del('qHotDealData');
                await client.sAdd('qHotDealData', Object.keys(crawlingResult));
                console.log('Successfully qHotDealData Update!');
            }
        } else {
            await client.sAdd('qHotDealData', Object.keys(crawlingResult));
            console.log('Successfully qHotDealData Setup!');
        }
    } catch (err) {
        console.error('From Q_hotDeal:', err.response?.status || err.message, err.message);
        if (err.message.indexOf("timeout") !== 0) {
            const embed = new MessageBuilder()
                .setTitle('핫딜 알림에 문제가 발생하였습니다.')
                .setAuthor(
                    "에러 알림",
                    'https://img2.quasarzone.com/level/c5449a659000c04b0c54f45a023a1d97.png'
                )
                .setColor('#FF0000')
                .setTimestamp();
            hook.send(embed);
        }
    }
}

module.exports = async function () {
    await R_hotDeal();
    // await Q_hotDeal();
};