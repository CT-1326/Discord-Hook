const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const hook = new Webhook("YOUR WEBHOOK URL");

axios
    .get('https://bbs.ruliweb.com/market/board/1020')
    .then(function (html) {
        // console.log(html.data);
        const $ = cheerio.load(html.data);
        const readNumber = JSON.parse(fs.readFileSync('./lastNumber.json'));
        // console.log(readNumber.lastNumber);
        const number = $(
            "#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil" +
            "d(7) > td.id"
        )
            .text()
            .replace(/\s/g, '');
        // console.log(number);

        if (readNumber.lastNumber != number) {
            const title = $(
                "#board_list > div > div.board_main.theme_default > table > tbody > tr:nth-chil" +
                "d(7) > td.subject > div > a.deco"
            ).text();
            // console.log(title);
            const embed = new MessageBuilder()
                .setTitle(title)
                .setAuthor(
                    "알림봇",
                    'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                )
                .setURL('https://bbs.ruliweb.com/market/board/1020/read/' + number)
                .setColor('#181696')
                .setFooter(
                    '올라온 시간',
                    'https://img.ruliweb.com/img/2016/icon/ruliweb_icon_144_144.png'
                )
                .setTimestamp();
            hook.send(embed);
            const postData = JSON.stringify({"lastNumber": number});
            // console.log(postData);
            fs.writeFileSync('./lastNumber.json', postData);
        }
    })
    .catch(function (e) {
        console.log(e);
    });