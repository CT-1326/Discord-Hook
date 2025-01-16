const {Webhook, MessageBuilder} = require('discord-webhook-node');
const hook = new Webhook(process.env.JP_JOB_URL); // webhook 경로 등록
const axios = require('axios');
const redis = require('redis');
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
}); // redis 연동

let data = JSON.stringify({
    "mode": "getLists",
    "bclass": "I",
    "bcode": "EMPLOYMENT",
    "page": 1,
    "findClass": "subject",
    "findWord": ""
});

let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://www.jlpt.or.kr/INC/boardAjax.php',
    headers: { 
        'Accept': 'application/json, text/plain, */*', 
        'Accept-Language': 'ko,en;q=0.9,ko-KR;q=0.8,en-US;q=0.7', 
        'Connection': 'keep-alive', 
        'Content-Type': 'application/json', 
        'Cookie': 'PHPSESSID=kh0mng9pk25dub71jbtm7o4ptk; nowdays=read_2025-01-16; PHPSESSID=aifla34ickjgokeb5771blfod6', 
        'DNT': '1', 
        'Origin': 'https://www.jlpt.or.kr', 
        'Referer': 'https://www.jlpt.or.kr/html/info02.html', 
        'Sec-Fetch-Dest': 'empty', 
        'Sec-Fetch-Mode': 'cors', 
        'Sec-Fetch-Site': 'same-origin', 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"', 
        'sec-ch-ua-mobile': '?0', 
        'sec-ch-ua-platform': '"Windows"'
    },
    data : data
};

module.exports = function () {
    hook.setUsername('JP Alert'); // BOT 이름 작성
    axios(config)
        .then(async function (response) {
            const getData = response.data.list;
            // console.log(getData);
            /* 해당 API 데이터의 idx(번호), subject(제목) 값 파싱처리 */
            Result = {};
            for (let index = 0; index < getData.length; index++) {
                let postID = getData[index].idx;
                let postTitle = `[${getData[index].etc01}] ${getData[index].etc02} - ${getData[index].subject}`;
                Result[postID] = postTitle;
            }
            /* JP 데이터 컬렉션 호출 */
            await client
                .on('error', err => console.error('Redis Client Error', err))
                .connect();
            const jpJobData = await client.sMembers('jpJobData');
            /* 해당 컬렉션 존재 시 저장되지 않은 값을 신규 게시물로 판별해 메시지 전송 및 업데이트*/
            if (jpJobData.length != 0) {
                const FilterNewData = Object
                    .keys(Result)
                    .filter(item => !jpJobData.includes(item));
                if (FilterNewData.length != 0) {
                    const newData = FilterNewData.reduce((acc, key) => {
                        acc[key] = Result[key]
                        return acc;
                    }, {});
                    for (const key in newData) {
                        const embed = new MessageBuilder()
                            .setTitle(newData[key])
                            .setAuthor(
                                "JP Job",
                                'https://www.jlpt.or.kr/html/images/logo.png'
                            )
                            .setURL('https://www.jlpt.or.kr/html/info02.html') // 메시지 클릭 시 해당 게시물 주소로 연결
                            .setColor('#ffffff')
                            .setTimestamp();
                        await hook.send(embed);
                    }
                    await client.del('jpJobData');
                    await client.sAdd('jpJobData', Object.keys(Result));
                    console.log('Successfully jpJobData Update!');
                }
            } else { /* 컬렉션이 존재하지 않을 경우 값 전체 저장 */
                await client.sAdd('jpJobData', Object.keys(Result));
                console.log('Successfully jpJobData Setup!');
            }
            await client.disconnect();
        })
        .catch(function (err) {
            console.error('From jpJob:', err.message);
            if (err.message.indexOf("timeout") !== 0) {
                const embed = new MessageBuilder()
                    .setTitle('JP 알림에 문제가 발생하였습니다.')
                    .setAuthor(
                        "에러 알림",
                        'https://www.jlpt.or.kr/html/images/logo.png'
                    )
                    .setColor('#FF0000')
                    .setTimestamp();
                hook.send(embed);
            }
        });
}