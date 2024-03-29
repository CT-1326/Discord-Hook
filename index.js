const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const schedule = require('node-schedule');
const drug = require('./scripts/drug');
const gongmo = require('./scripts/gongmo');
const hotDeal = require('./scripts/hotDeal');

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
    /* 리스너에 시간대별 스케줄링 작성 */
    schedule.scheduleJob('0 22 * * *', function () {
        drug();
    });
    schedule.scheduleJob('0 11 * * *', function () {
        drug();
    });

    schedule.scheduleJob('*/10 * * * *', function () {
        hotDeal();
    });

    // schedule.scheduleJob('0 * * * *', function () {
    //     gongmo();
    // });
});
