const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
const cheerio = require('cheerio');
const hook = new Webhook("YOUR WEBHOOK URL");
const redis = require('redis');
const client = redis.createClient('YOUR redis URL');

axios
    .get('https://bbs.ruliweb.com/market/board/1020')
    .then(function (html) {
        // console.log(html.data);
        const $ = cheerio.load(html.data);
        client.get('lastID', (err, reply) => {
            let index;
            let lastID = reply;
            console.log('redis value: ', lastID);
            const tableLength = $(
                '#board_list > div > div.board_main.theme_default > table > tbody > tr'
            ).length;
            for (index = 1; index <= tableLength; index++) {
                let test = $(
                    '#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil' +
                    'd(' + index + ')'
                )
                    .attr()
                    .class;
                if (test == 'table_body') {
                    break;
                }
            }
            // console.log(index);
            const getID = $(
                "#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil" +
                "d(" + index + ") > td.id"
            )
                .text()
                .replace(/\s/g, '');
            console.log('lastID value: ', getID);
            if (lastID != getID) {
                const title = $(
                    "#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil" +
                    "d(" + index + ") > td.subject > div > a.deco"
                ).text();
                // console.log(title);
                const embed = new MessageBuilder()
                    .setTitle(title)
                    .setAuthor(
                        "알림봇",
                        'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                    )
                    .setURL('https://bbs.ruliweb.com/market/board/1020/read/' + getID)
                    .setColor('#181696')
                    .setFooter(
                        '올라온 시간',
                        'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                    )
                    .setTimestamp();
                hook.send(embed);
                client.set("lastID", getID);
            }
            client.quit();
        });
    })
    .catch(function (e) {
        console.log(e);
    });