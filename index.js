"use strict";
require('dotenv').config();
const express = require('express');
const ejs_1 = require('ejs');
const fetch = require('node-fetch');
const fs_1 = require('fs');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.get('/botchat', (req, res) => {
    fs_1.readFile('./botchat/index.html', (err, data) => {
        const contents = data.toString();
        if (req.cookies.settings) {
            console.log("cookie", req.cookies.settings);
            let settings = "";
            if (req.cookies.settings.title)
                settings += `, title: "${req.cookies.settings.title}"`;
            if (req.cookies.settings.allowMessagesFrom)
                settings += `, allowMessagesFrom: ['${req.cookies.settings.allowMessagesFrom.replace(" ", "").replace(",", "','")}']`;
            console.log("settings", settings);
            res.send(contents.replace("// ADD MORE CONFIG HERE", settings));
        }
        else {
            res.send(contents);
        }
    });
});
app.use('/botchat', express.static('botchat'));
app.post('/', (req, res) => {
    res.cookie('settings', req.body);
    res.redirect('/');
});
app.get('/', (req, res) => {
    const appSecret = (req.cookies.settings && req.cookies.settings.secret) || process.env.APP_SECRET;
    fetch('https://directline.botframework.com/api/tokens/conversation', {
        method: 'POST',
        headers: {
            Authorization: `BotConnector ${appSecret}`
        } }).then(response => {
        response.text().then(text => {
            console.log("token", text, "retrieved at", new Date());
            ejs_1.renderFile("./index.html", {
                token: text.split('"')[1],
                title: req.cookies.settings && req.cookies.settings.title,
                secret: req.cookies.settings && req.cookies.settings.secret,
                allowMessagesFrom: req.cookies.settings && req.cookies.settings.allowMessagesFrom
            }, (err, str) => {
                if (err)
                    console.log("ejs error", err);
                else
                    res.send(str);
            });
        });
    });
});
app.listen(process.env.port || process.env.PORT || 3000, () => {
    console.log('listening');
});
