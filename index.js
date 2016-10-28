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
const guid = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};
app.get('/botchat', (req, res) => {
    fs_1.readFile('./botchat/index.html', (err, data) => {
        const contents = data.toString();
        let settings = "";
        settings += `, user: { id: "${guid()}", name: "your name here" }`;
        if (req.cookies.settings) {
            console.log("cookie", req.cookies.settings);
            settings += `, formatOptions: { showHeader: "${req.cookies.settings.showHeader}" }`;
            if (req.cookies.settings.allowMessagesFrom)
                settings += `, allowMessagesFrom: ['${req.cookies.settings.allowMessagesFrom.replace(" ", "").replace(",", "','")}']`;
        }
        console.log("settings", settings);
        res.send(contents.replace("// ADD MORE CONFIG HERE", settings));
    });
});
app.use('/botchat', express.static('botchat'));
app.post('/', (req, res) => {
    res.cookie('settings', req.body);
    res.redirect('/');
});
app.get('/', (req, res) => {
    const appSecret = (req.cookies.settings && req.cookies.settings.secret) || process.env.APP_SECRET;
    console.log("query", req.query);
    const dl3 = req.query["dl3"];
    const segment = req.query["segment"];
    const endpoint = dl3 ?
        `https://${dl3}/${segment}/tokens/generate` :
        'https://directline.botframework.com/api/tokens/conversation';
    const auth = dl3 ? 'Bearer' : 'BotConnector';
    fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `${auth} ${appSecret}`, Accept: "application/json" }
    }).then(response => {
        return dl3 ? response.json() : response.text();
    }).then(result => {
        const token = dl3 ? result["token"] : result.split('"')[1];
        console.log("token", token, "retrieved at", new Date());
        ejs_1.renderFile("./index.html", {
            token,
            dl3,
            segment,
            showHeader: req.cookies.settings && req.cookies.settings.showHeader,
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
app.listen(process.env.port || process.env.PORT || 3000, () => {
    console.log('listening');
});
