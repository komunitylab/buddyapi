'use strict';

const path = require('path'),
      nodemailer = require('nodemailer'),
      EmailTemplate = require('email-templates').EmailTemplate,
      fs = require('fs-extra'),
      hbs = require('handlebars'),
      sanitize = require(path.resolve('./services/text')),
      config = require(path.resolve('./config'));

// register handlebars partials and helpers
(function () {

  // definite partials and helpers
  hbs.registerHelper('html-partial', name => `${name}-html`);
  hbs.registerHelper('text-partial', name => `${name}-text`);

  // configurable partials
  const partialNames = [
    'notify-messages',
    'verify-email'
  ];

  partialNames.forEach(name => registerPartial(name));

  function registerPartial(name) {
    // do this on startup, therefore synchronously

    // read the partials from files
    const partialHtml = fs.readFileSync(path.join(__dirname, 'templates', name, 'html.hbs'));
    const partialText = fs.readFileSync(path.join(__dirname, 'templates', name, 'text.hbs'));
    // register
    hbs.registerPartial(`${name}-html`, partialHtml.toString());
    hbs.registerPartial(`${name}-text`, partialText.toString());
  }

}());


async function sendMail(type, params, email, subject) {
  const template = new EmailTemplate(path.join(__dirname, 'templates', 'main'));
  const { html, text } = await template.render({ type, params, subject });

  const toSend = { to: `<${email}>`, subject, html, text };

  return await exports.general(toSend);
}

exports.general = async function general({ to, from='info@buddybrno.cz <info@buddybrno.cz>', subject, html, text }) {
  let transporter;
  try {
    transporter = nodemailer.createTransport(config.mailer);

    const emailOptions = { from, to, subject, html, text };

    const info = await new Promise(function (resolve, reject) {
      transporter.sendMail(emailOptions, function (err, response) {
        if(err) return reject(err);
        return resolve(response);
      });
    });

    return info;
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
};

exports.verifyEmail = async function verifyEmail({ email, url, username, code }) {
  const subject =  'Email verification for Buddy Brno';
  return await sendMail('verify-email', { url, username, code }, email, subject);
};

exports.notifyMessages = async function notifyMessages({ messages, sender, receiver }) {
  const { email } = receiver;
  const subject = `${sender.username} sent you a message on Buddy Brno`;
  // TODO url
  const url = `https://this.is.url/to/the-conversation-with/${sender.username}/in-the-app`;

  // TODO sanitize
  const sanitizedMessages = {
    text: messages.map(({ body }) => sanitize.plainText(body)),
    html: messages.map(({ body }) => sanitize.html(body))
  };

  return await sendMail('notify-messages', { sender, receiver, messages: sanitizedMessages, url, isMore: messages.length > 1 }, email, subject);
};
