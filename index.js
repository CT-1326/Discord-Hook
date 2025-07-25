const express = require('express');
const app = express();
const port = 3000;
const schedule = require('node-schedule');
require('dotenv').config();
const drug = require('./scripts/drug');
const hotDeal = require('./scripts/hotDeal');
const jpJob = require('./scripts/jpJob');

schedule.scheduleJob('0 22 * * *', function () {
    drug();
});
// schedule.scheduleJob('0 11 * * *', function () {
//     drug();
// });
schedule.scheduleJob('*/10 * * * *', function () {
    hotDeal();
});

schedule.scheduleJob('0 0 * * *', function () {
    jpJob();
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
