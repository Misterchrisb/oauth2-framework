// Imports
import * as express from 'express';
import * as jsonwebtoken from 'jsonwebtoken';

// Imports models
import { Client } from './models/client';
import { Token } from './models/token';

// Exports
export { Client } from './models/client';
export { Token } from './models/token';
export { OAuth2FrameworkRouter } from './router';

export class OAuth2Framework {

    constructor(public model: {
        findClient: (client_id: string, request: express.Request) => Promise<Client>,
        register: (client_id: string, emailAddress: string, username: string, password: string, request: express.Request) => Promise<boolean>,
        resetPassword: (client_id: string, username: string, password: string, request: express.Request) => Promise<boolean>,
        sendForgotPasswordEmail: (client_id: string, username: string, resetPasswordUrl: string, request: express.Request) => Promise<boolean>,
        sendVerificationEmail: (client_id: string, emailAddress: string, username: string, verificationUrl: string, request: express.Request) => Promise<boolean>,
        validateCredentials: (client_id: string, username: string, password: string, request: express.Request) => Promise<boolean>,
        verify: (client_id: string, username: string, request: express.Request) => Promise<boolean>,
        generateCode(client_id: string, username: string, scopes: string[], request: express.Request): Promise<string>,
        validateCode(code: string, request: express.Request): Promise<Token>,
        generateAccessToken(client_id: string, username: string, scopes: string[], request: express.Request): Promise<string>,
        validateAccessToken(access_token: string, request: express.Request): Promise<Token>,
    }, public secret: string,
    ) {

    }

    public async authorizationRequest(
        response_type: string,
        client_id: string,
        redirect_uri: string,
        scopes: string[],
        state: string,
        username: string,
        password: string,
        request: express.Request): Promise<string> {

        const client: Client = await this.model.findClient(client_id, request);

        if (response_type === 'code' || response_type === 'token') {

            if (!client) {
                throw new Error('Invalid client_id');
            }

            if (client.redirectUris.indexOf(redirect_uri) === -1) {
                throw new Error('Invalid redirect_uri');
            }

            if (scopes.length !== 0 && scopes.filter((x) => client.allowedScopes.indexOf(x) === -1).length !== 0) {
                throw new Error('Invalid scopes');
            }

            const validCredentials: boolean = await this.model.validateCredentials(client_id, username, password, request);

            if (!validCredentials) {
                return null;
            }
        }

        if (response_type === 'code') {
            return this.model.generateCode(client_id, username, scopes, request);
        } else if (response_type === 'token') {
            return this.model.generateAccessToken(client_id, username, scopes, request);
        } else {
            throw new Error('Invalid response_type');
        }
    }

    public async accessTokenRequest(
        grant_type: string,
        code: string,
        redirect_uri: string,
        client_id: string,
        client_secret: string,
        username: string,
        password: string,
        scopes: string[],
        request: express.Request): Promise<string> {

        const client: Client = await this.model.findClient(client_id, request);

        if (grant_type === 'authorization_code' || grant_type === 'password') {

            if (!client) {
                throw new Error('Invalid client_id');
            }

            if (client.redirectUris.indexOf(redirect_uri) === -1) {
                throw new Error('Invalid redirect_uri');
            }
        }

        if (grant_type === 'password') {
            const validCredentials: boolean = await this.model.validateCredentials(
                client_id,
                username,
                password,
                request);

            if (!validCredentials) {
                return null;
            }

            return this.model.generateAccessToken(client_id, username, scopes, request);
        } else if (grant_type === 'authorization_code') {

            const token: Token = await this.model.validateCode(code, request);

            if (!token) {
                throw new Error('Invalid code');
            }

            if (client.secret !== client_secret) {
                throw new Error('Invalid client_secret');
            }

            return this.model.generateAccessToken(
                token.client_id,
                token.username,
                token.scopes,
                request);
        } else {
            throw new Error('Invalid grant_type');
        }
    }

    public async validateAccessToken(access_token: string, request: express.Request): Promise<boolean> {
        const token: Token = await this.model.validateAccessToken(access_token, request);

        if (!token) {
            return false;
        }

        return true;
    }

    public async decodeAccessToken(access_token: string, request: express.Request): Promise<Token> {
        const token: Token = await this.model.validateAccessToken(access_token, request);

        if (!token) {
            return null;
        }

        return token;
    }

    public async forgotPasswordRequest(
        client_id: string,
        username: string,
        response_type: string,
        redirect_uri: string,
        state: string,
        request: express.Request): Promise<boolean> {
        const client: Client = await this.model.findClient(client_id, request);

        if (!client) {
            throw new Error('Invalid client_id');
        }

        if (!client.allowForgotPassword) {
            throw new Error('Function not enabled for client');
        }

        const returnUrl = `authorize?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}`;
        const resetPasswordToken = this.generateResetPasswordToken(client_id, username, returnUrl);

        const resetPasswordUrl = `/reset-password?token=${resetPasswordToken}`;

        const result = await this.model.sendForgotPasswordEmail(
            client_id,
            username,
            resetPasswordUrl,
            request);

        return result;
    }

    public async emailVerificationRequest(token: string, request: express.Request): Promise<boolean> {
        const decodedToken: any = await this.decodeEmailVerificationToken(token);

        if (!decodedToken) {
            throw new Error('Invalid token');
        }

        const client: Client = await this.model.findClient(decodedToken.client_id, request);

        if (!client) {
            throw new Error('Invalid client_id');
        }

        if (!client) {
            throw new Error('Invalid client_id');
        }

        if (!client.allowRegister) {
            throw new Error('Function not enabled for client');
        }

        const result = await this.model.verify(
            decodedToken.client_id,
            decodedToken.username,
            request);

        return result;
    }

    public async registerRequest(
        client_id: string,
        emailAddress: string,
        username: string,
        password: string,
        response_type: string,
        redirect_uri: string,
        state: string,
        request: express.Request): Promise<boolean> {
        const client: Client = await this.model.findClient(client_id, request);

        if (!client) {
            throw new Error('Invalid client_id');
        }

        if (!client.allowRegister) {
            throw new Error('Function not enabled for client');
        }

        const returnUrl = `authorize?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}`;
        const emailVerificationToken = this.generateEmailVerificationToken(
            client_id,
            username,
            returnUrl);

        const emailVerificationUrl = `/email-verification?token=${emailVerificationToken}`;

        const result = await this.model.register(client_id, emailAddress, username, password, request);

        if (result) {
            const emailResult = await this.model.sendVerificationEmail(
                client_id, emailAddress,
                username,
                emailVerificationUrl,
                request);
        }

        return result;
    }

    public async resetPasswordRequest(token: string,
        password: string,
        request: express.Request): Promise<boolean> {

        const decodedToken: any = await this.decodeResetPasswordToken(token);

        if (!decodedToken) {
            throw new Error('Invalid token');
        }

        const client: Client = await this.model.findClient(decodedToken.client_id, request);

        if (!client) {
            throw new Error('Invalid client_id');
        }

        if (!client.allowForgotPassword) {
            throw new Error('Function not enabled for client');
        }

        const result = await this.model.resetPassword(
            decodedToken.client_id,
            decodedToken.username,
            password,
            request);

        return result;
    }

    public async decodeResetPasswordToken(token: string): Promise<any> {

        const decodedToken: any = await this.decodeJWT(token);

        if (!decodedToken) {
            return null;
        }

        if (decodedToken.type !== 'reset-password') {
            return null;
        }

        return decodedToken;
    }

    public async decodeEmailVerificationToken(token: string): Promise<any> {
        const decodedToken: any = await this.decodeJWT(token);

        if (!decodedToken) {
            return null;
        }

        if (decodedToken.type !== 'email-verification') {
            return null;
        }

        return decodedToken;
    }

    private generateResetPasswordToken(
        client_id: string,
        username: string,
        return_url: string): string {
        return jsonwebtoken.sign({
            client_id,
            return_url,
            type: 'reset-password',
            username,
        }, this.secret, {
                expiresIn: '60m',
            });
    }

    private generateEmailVerificationToken(
        client_id: string,
        username: string,
        return_url: string): string {
        return jsonwebtoken.sign({
            client_id,
            return_url,
            type: 'email-verification',
            username,
        }, this.secret, {
                expiresIn: '60m',
            });
    }

    private decodeJWT(jwt: string): Promise<string> {
        return new Promise((resolve, reject) => {
            jsonwebtoken.verify(jwt, this.secret, (err: Error, decodedCode: any) => {

                if (err) {
                    resolve(null);
                    return;
                }

                resolve(decodedCode);
            });
        });
    }
}
