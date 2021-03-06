# OAuth2 Framework

The OAuth 2.0 authorization framework enables a third-party    application to obtain limited access to an HTTP service, either on    behalf of a resource owner by orchestrating an approval interaction    between the resource owner and the HTTP service, or by allowing the    third-party application to obtain access on its own behalf.

## Getting Started

* [Demo (Authorization Code Grant)](https://ketone.openservices.co.za)
* [API Documentation](https://ketone.openservices.co.za/api/docs/)
* [Source Code](https://github.com/barend-erasmus/oauth2-framework)

![](https://github.com/barend-erasmus/oauth2-framework/raw/master/images/diagram.png)

## Installation

`npm install --save oauth2-framework`

## Usage

```javascript

import { Client, OAuth2FrameworkRouter, Token } from 'oauth2-framework';

const model: any = {
    findClient: (client_id: string, request: express.Request) => {
        if (client_id === '0zyrWYATtw') {
            return Promise.resolve(new Client('0zyrWYATtw', 'x3h8CTB2Cj', [], ['http://example.com/callback'], true, true));
        } else {
            return Promise.resolve(null);
        }
    },
    register: (client_id: string, emailAddress: string, username: string, password: string, request: express.Request) => {
        return Promise.resolve(true);
    },
    resetPassword: (client_id: string, username: string, password: string, request: express.Request) => {
        return Promise.resolve(true);
    },
    sendForgotPasswordEmail: (client_id: string, username: string, resetPasswordUrl: string, request: express.Request) => {
        
        // TODO: Send email via STMP, SendGrid or Mandrill

        return Promise.resolve(true);
    },
    sendVerificationEmail: (client_id: string, emailAddress: string, username: string, verificationUrl: string, request: express.Request) => {

        // TODO: Send email via STMP, SendGrid or Mandrill

        return Promise.resolve(true);
    },
    validateCredentials: (client_id: string, username: string, password: string, request: express.Request) => {
        if (username.toLowerCase() === 'demo' && password === '123456') {
            return Promise.resolve(true);
        } else {
            return Promise.resolve(false);
        }
    },
    verify: (client_id: string, username: string, request: express.Request) => {
        return Promise.resolve(true);
    },
    generateCode: (client_id: string, username: string, scopes: string[], request: express.Request) => {
        const token: string = '...';

        // Store token with details

        return Promise.resolve(token);
    },
    validateCode: (code: string, request: express.Request) => {
        const token: Token = new Token('client_id', 'username', []);

        return token;
    },
    generateAccessToken: (client_id: string, username: string, scopes: string[], request: express.Request) => {
        const token: string = '...';

        // Store token with details

        return Promise.resolve(token);
    },
    validateAccessToken: (code: string, request: express.Request) => {
        const token: Token = new Token('client_id', 'username', []);

        return token;
    }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', OAuth2FrameworkRouter(
    model,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
));

app.listen(3000, () => {
    console.log(`listening on port 3000`);
});
```

## Specifications

### Client

The Client consists of:

* `name: string` - Will be displayed on login, registration and forgot password pages.
* `id: string` - Will be used to  identify the client.
* `secret: string` - Will be used in various grant types.
* `allowedScopes: string[]` - Will be used to validate an authorization request.
* `redirectUris: string[]` - Will be used to validate an authorization request.
* `allowForgotPassword: boolean` - Will enable or disable the forgot password functionality.
* `allowRegister: boolean` - Will enable or disable the register functionality.

### OAuth2 Framework Model

The OAuth2 Framework Model is an interface which you'll need to implement in order for the framework to communicate with your database or API.

The OAuth2 Framework Model consists of:

* `findClient: (client_id: string) => Promise<Client>` - Will be used to find a Client by its id.
* `register: (client_id: string, emailAddress: string, username: string, password: string) => Promise<boolean>` - Will be used to register a new user.
* `resetPassword: (client_id: string, username: string, password: string) => Promise<boolean>` - Will be used to reset the user's password.
* `sendForgotPasswordEmail: (client_id: string, username: string, resetPasswordUrl: string) => Promise<boolean>` - Will be used to send the forgot password email and should return `true` on success and `false`  on failure.
* `sendVerificationEmail: (client_id: string, emailAddress: string, username: string, verificationUrl: string) => Promise<boolean` - Will be used to send the verification email and should return `true` on success and `false` on failure.
* `validateCredentials: (client_id: string, username: string, password: string) => Promise<boolean>` - Will be used to validate a user's credentials and should return `true` if valid and `false` if not.
* `verify: (client_id: string, username: string) => Promise<boolean>` - Will be used when user click on verification url.
* `generateCode: (client_id: string, username: string, scopes: string[], request: express.Request) => Promise<string>` - 
* `validateCode: (code: string, request: express.Request) => Promise<Token>` - 
* `generateAccessToken: (client_id: string, username: string, scopes: string[], request: express.Request) => Promise<string>` - 
* `validateAccessToken: (code: string, request: express.Request) => Promise<Token>` - 

## Template Flows

![](https://github.com/barend-erasmus/oauth2-framework/raw/master/images/flow-diagram-1.png)


![](https://github.com/barend-erasmus/oauth2-framework/raw/master/images/flow-diagram-2.png)

```javascript
app.use('/', OAuth2FrameworkRouter(
    model,
    'path of login template',
    'path of forgot-password template',
    'path of forgot-password-success template',
    'path of forgot-password-failure template',
    'path of reset-password template'
    'path of register template',
    'path of register-success template',
    'path of register-failure template',
    'path of email-verification-success template',
    'path of email-verification-failure template',
));
```

## Customizing Templates

OAuth2 Framework uses `handlebars` as a templating engine and each template is given the same model which is defined below.

```
{
    "client": client,
    "message": null,
    "query": req.query,
}
```

### Login Template

This template has the following requirements:

* Must be a `POST`.
* Must have a field `username`.
* Must have a field `password`.

```html
<form method="post">
    <div>
        <label>Username:</label>
        <input type="text" name="username">
    </div>
    <div>
        <label>Password</label>
        <input type="password" name="password">
    </div>
    <p>{{message}}</p>
    <div class="button">
        <button type="submit">Login</button>
    </div>
</form>
```

### Forgot Password Template

Coming soon...

### Forgot Password Success Template

Coming soon...

### Forgot Password Failure Template

Coming soon...

### Reset Password Template

Coming soon...

### Register Template

Coming soon...

### Register Success Template

Coming soon...

### Register Failure Template

Coming soon...

### Email Verification Success Template

Coming soon...

### Email Verification Failure Template

Coming soon...

## Supported Grant Types

* Authorization Code Grant
* Implicit Grant
* Resource Owner Password Credentials Grant
