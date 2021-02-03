const {Webhook, MessageBuilder} = require('discord-webhook-node');
const axios = require('axios');
const cheerio = require('cheerio');
const hook = new Webhook(
    "https://discord.com/api/webhooks/800281509335400448/YphrCNb2ocEfbim9Hn1Jl4ei4M" +
    "T5xGzGoxhiFGE3Lw0YdkB4B9ELo3iVtfNHbdIYWBmG"
);

axios.get('https://www.campuspick.com/contest?category=108').then(function (params) {
    // console.log(params.data);
    const $ = cheerio.load(params.data);
    const title = $('head > title').text();
    console.log(title);
    
    const embed = new MessageBuilder()
    .setTitle('새로운 공모전이 올라오다!')
    .setAuthor(title, 'https://www.campuspick.com/favicon.ico')
    .setURL('https://www.campuspick.com/contest?category=108')
    .setColor('#00b0f4')
    .setFooter('올라온 시간', 'https://www.campuspick.com/favicon.ico')
    .setTimestamp();

    hook.send(embed);
})