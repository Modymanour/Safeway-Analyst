import nodemailer from "nodemailer";
import { ValidationError } from "./errors/errors.ts"
import { env } from "../config/env";

export const send_email = async (
    recipient: string,
    subject: string,
    message: { text: string; html: string }
): Promise<void> => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: env.EMAIL, 
            pass: env.EMAIL_PASSWORD
        }
    });

    // Define the email options
    const mailOptions = {
        from: env.EMAIL,
        to: recipient, 
        subject: subject, 
        text: message.text,
        html: message.html,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error occurred while sending email:", error);
        throw new ValidationError("Error occurred while sending email");
    }
};

export const send_verification_email = async (
    recipient: string,
    username: string,
    otp: string
): Promise<void> => {
    const safeUsername = username.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '\"': "&quot;",
    "'": "&#39;",
    })[character]!);

    await send_email(recipient, "Verify your Safe Way account", {
    text: `Hi ${username}, your Safe Way verification code is ${otp}. It expires in 15 minutes. If you didn't create this account, you can ignore this email.`,
    html: `
                        <!doctype html>
                        <html lang="en">
                            <head>
                                <meta charset="utf-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1">
                                <meta name="color-scheme" content="light">
                                <title>Verify your Safe Way account</title>
                            </head>
                            <body style="margin:0;padding:0;background-color:#f3f6f8;font-family:Arial,Helvetica,sans-serif;color:#172b3a;">
                                <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Safe Way verification code is ${otp}. It expires in 15 minutes.</div>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f6f8;padding:32px 16px;">
                                    <tr>
                                        <td align="center">
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8ed;border-radius:16px;">
                                                <tr>
                                                    <td style="padding:36px 36px 28px;">
                                                        <p style="margin:0 0 24px;color:#147d72;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Safe Way</p>
                                                        <h1 style="margin:0 0 16px;font-size:25px;line-height:1.3;color:#172b3a;">Confirm your email address</h1>
                                                        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#526574;">Hi ${safeUsername}, enter this one-time verification code to finish setting up your account.</p>
                                                        <div style="margin:0 0 24px;padding:20px;background-color:#f1f8f7;border:1px solid #d5ebe7;border-radius:12px;text-align:center;">
                                                            <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#116b63;">${otp}</span>
                                                        </div>
                                                        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#526574;">This code expires in <strong>15 minutes</strong>. For your security, don’t share it with anyone.</p>
                                                        <p style="margin:0;font-size:14px;line-height:1.6;color:#526574;">If you didn’t create a Safe Way account, you can ignore this email.</p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:18px 36px;border-top:1px solid #edf1f3;">
                                                        <p style="margin:0;font-size:12px;line-height:1.5;color:#81909b;">This is an automated message. Please don’t reply to this email.</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </body>
                        </html>
            `,
            });
};

    export const send_password_reset_email = async (
            recipient: string,
            username: string,
            otp: string
    ): Promise<void> => {
            const safeUsername = username.replace(/[&<>\"']/g, (character) => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '\"': "&quot;",
                    "'": "&#39;",
            })[character]!);

            await send_email(recipient, "Your Safe Way password reset code", {
                    text: `Hi ${username}, your Safe Way password reset code is ${otp}. It expires in 15 minutes. If you didn't request a password reset, you can ignore this email.`,
                    html: `
                            <!doctype html>
                            <html lang="en">
                                <head>
                                    <meta charset="utf-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1">
                                    <meta name="color-scheme" content="light">
                                    <title>Reset your Safe Way password</title>
                                </head>
                                <body style="margin:0;padding:0;background-color:#f3f6f8;font-family:Arial,Helvetica,sans-serif;color:#172b3a;">
                                    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your password reset code is ${otp}. It expires in 15 minutes.</div>
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f6f8;padding:32px 16px;">
                                        <tr>
                                            <td align="center">
                                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8ed;border-radius:16px;">
                                                    <tr>
                                                        <td style="padding:36px 36px 28px;">
                                                            <p style="margin:0 0 24px;color:#147d72;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Safe Way</p>
                                                            <h1 style="margin:0 0 16px;font-size:25px;line-height:1.3;color:#172b3a;">Reset your password</h1>
                                                            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#526574;">Hi ${safeUsername}, use this one-time code to reset your account password.</p>
                                                            <div style="margin:0 0 24px;padding:20px;background-color:#f1f8f7;border:1px solid #d5ebe7;border-radius:12px;text-align:center;">
                                                                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#116b63;">${otp}</span>
                                                            </div>
                                                            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#526574;">This code expires in <strong>15 minutes</strong>. Don’t share it with anyone.</p>
                                                            <p style="margin:0;font-size:14px;line-height:1.6;color:#526574;">If you didn’t request a password reset, you can ignore this email.</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:18px 36px;border-top:1px solid #edf1f3;">
                                                            <p style="margin:0;font-size:12px;line-height:1.5;color:#81909b;">This is an automated message. Please don’t reply to this email.</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </body>
                            </html>
                    `,
            });
    };