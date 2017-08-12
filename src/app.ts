// Imports
import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as yargs from 'yargs';

import { OAuth2Framework, Client, OAuth2FrameworkRouter } from './index';

const argv = yargs.argv;
const app = express();

// Configures middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/api/docs', express.static(path.join(__dirname, './../apidoc')));
app.use('/api/coverage', express.static(path.join(__dirname, './../coverage/lcov-report')));

const framework = new OAuth2Framework({
    findClient: (client_id: string) => {
        return Promise.resolve(new Client(null, null, null, ['http://example.com/callback']));
    },
    validateCredentials: (client_id: string, username: string, password: string) => {
        if (username.toLowerCase() === 'demo' && password === '123456') {
            return Promise.resolve(true);
        } else {
            return Promise.resolve(false);
        }
    }
});

app.use('/', OAuth2FrameworkRouter(framework, null));

app.listen(argv.port || 3000, () => {
    console.log(`listening on port ${argv.port || 3000}`);
});