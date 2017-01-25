require('dotenv').config();

import * as express from 'express';
import { renderFile } from 'ejs';
import fetch = require('node-fetch');
import { readFile } from 'fs';
import cookieParser = require('cookie-parser');
import bodyParser = require('body-parser');

const app = express();
app.use(cookieParser())

interface Settings {
    appSecret: string
}

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const guid = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

app.post('/', (req, res) => {
    res.cookie('settings', req.body)
    res.redirect('/');
});

app.get('/', (req, res) => {
    const appSecret = (req.cookies.settings && req.cookies.settings.secret) || process.env.APP_SECRET;
    const endpoint = 'https://directline.botframework.com/v3/directline/tokens/generate';
    const auth = 'Bearer';
    fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `${auth} ${appSecret}`, Accept: "application/json" }
    }).then(response =>
        response.json()
    ).then(result => {
        const token: string = result["token"];
        console.log("token", token, "retrieved at", new Date());
        renderFile("./index.ejs", {
            token,
            secret: req.cookies.settings && req.cookies.settings.secret
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
