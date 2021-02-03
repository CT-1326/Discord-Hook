const Nightmare = require('nightmare')
const nightmare = Nightmare({show: true})


nightmare
    .goto("https://www.campuspick.com/contest?category=108")
    .evaluate(
        () => document.querySelector('#container > div.list').outerText
    )
    .end()
    .then(res => {
        console.log(res);
    })
    .catch(e => {
        console.error(e);
    });