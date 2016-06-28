'use strict';

import nodemailer from 'nodemailer';
import templates from './templates';

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_ACCOUNT,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const sendForgotPassword = (user, callback) => {
  let email = user.email;
  let html = templates.forgotPassword(user);
  console.log(html);
  const mailOptions = {
      from: 'Sumseti <automated@sumseti.com>',
      to: email,
      subject: 'Reset Password',
      html
  };

  transporter.sendMail(mailOptions, callback);
}

const sendInvitation = ({invitation, email}, callback) => {
  let html = templates.invitation({invitation});
  const mailOptions = {
      from: 'Sumseti <automated@sumseti.com>',
      to: email,
      subject: 'Invitation Received',
      html
  };

  transporter.sendMail(mailOptions, callback);
}

const mailer = {
  sendForgotPassword,
  sendInvitation,
};

export default mailer;
