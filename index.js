const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const schedule = require('node-schedule');
const {Webhook, MessageBuilder} = require('discord-webhook-node');
require('dotenv').config();
const hook = new Webhook(process.env.drug_URL); //  discord-webhook-node 라이브러리의 webhook 변수 생성

app.get([
    "/", "/:name"
], (req, res) => {
    greeting = "<h1>Hello From Node on Fly!</h1>";
    name = req.params["name"];
    if (name) {
        res.send(greeting + "</br>and hello to " + name);
    } else {
        res.send(greeting);
    }
});

app.listen(port, () => {
    schedule.scheduleJob('0 0 7 * * *', function () {
        hook.setUsername('Drug BOT');
        const embed = new MessageBuilder()
            .setTitle('약 먹자')
            .setColor('#FF0000')
            .setTimestamp(); // 지정된 시간에 메시지가 도착하였는지를 확인하기 위한 시간대 출력
        hook.send(embed);
    });
    schedule.scheduleJob('0 0 20 * * *', function () {
        hook.setUsername('Drug BOT');
        const embed = new MessageBuilder()
            .setTitle('약 먹자')
            .setColor('#FF0000')
            .setTimestamp(); // 지정된 시간에 메시지가 도착하였는지를 확인하기 위한 시간대 출력
        hook.send(embed);
    });
});
