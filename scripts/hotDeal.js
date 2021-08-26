const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
const cheerio = require('cheerio');
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
require('dotenv').config();
const hook = new Webhook(process.env.hotDeal_URL);

axios
    .get('https://bbs.ruliweb.com/market/board/1020', {timeout: 3000})
    .then(function (html) {
        // console.log(html.data);
        const $ = cheerio.load(html.data);
        const arr = [];
        let check = false;
        client.get('lastID', (err, reply) => {
            console.log('Redis lastID value:', reply);
            const tableLength = $(
                '#board_list > div > div.board_main.theme_default > table > tbody > tr'
            ).length;
            for (let index = 1; index <= tableLength; index++) {
                let tableName = $(
                    '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                    'd(' + index + ')'
                )
                    .attr()
                    .class;
                if (tableName == 'table_body') {
                    let checkID = $(
                        '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                        'd(' + index + ') > td.id'
                    )
                        .text()
                        .replace(/\s/g, '');
                    console.log('Hotdeal ID value:', checkID);
                    arr.push(checkID);
                    if (reply.indexOf(checkID) == -1) {
                        check = true;
                        const title = $(
                            '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                            'd(' + index + ') > td.subject > div > a.deco'
                        ).text();
                        // console.log(title);
                        const embed = new MessageBuilder()
                            .setTitle(title)
                            .setAuthor(
                                "알림봇",
                                'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                            )
                            .setURL('https://bbs.ruliweb.com/market/board/1020/read/' + checkID)
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
            // console.log(arr);
            if (check) {
                const redisValue = JSON.stringify(arr);
                client.set('lastID', redisValue);
            }
            client.quit();
        });
    })
    .catch(function (e) {
        console.log(e);
        process.exit();
    });