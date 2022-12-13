const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const schedule = require('node-schedule');
const gongmo = require('./scripts/gongmo');
const drug = require('./scripts/drug');
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
    schedule.scheduleJob('0 22 * * *', function () {
        drug();
    });
    schedule.scheduleJob('0 11 * * *', function () {
        drug();
    });

    schedule.scheduleJob('0 * * * *', function () {
        gongmo();
    });

    schedule.scheduleJob('*/10 * * * *', function () {
        console.log(process.env.TEST);
        hotDeal();
    });
});
