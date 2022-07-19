const queryString = require('query-string');
const axios = require('axios');
const { User } = require('../../models');
const jwt = require('jsonwebtoken');

const bcrypt = require('bcrypt');

const googleAuth = async (req, res) => {
  const stringifiedParams = queryString.stringify({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.CLIENT_URL}/api/users/google-redirect`,
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  });
  return res.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`,
  );
};

const googleRedirect = async (req, res) => {
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const urlObj = new URL(fullUrl);
  const urlParams = queryString.parse(urlObj.search);
  const code = urlParams.code;
  const tokenData = await axios({
    url: `https://oauth2.googleapis.com/token`,
    method: 'post',
    data: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.CLIENT_URL}/api/users/google-redirect`,
      grant_type: 'authorization_code',
      code,
    },
  });
  const userData = await axios({
    url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    method: 'get',
    headers: {
      Authorization: `Bearer ${tokenData.data.access_token}`,
    },
  });

  const email = userData.data.email;
  //! - мой код -------------------------------------
  const userName = userData.data.name;
  //! -----------------------------------------------
  let user = await User.findOne({ email }); //! -  const

  //! - мой код -------------------------------------
  if (!user) {
    encryptedPassword = await bcrypt.hash(genPass(), 10);

    user = await User.create({
      email,
      name: userName,
      password: encryptedPassword,
    });
  }
  //! -----------------------------------------------
  // if (user) {
  const payload = { id: user._id, email };
  const token = jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: '1d' });

  await User.findByIdAndUpdate(user._id, { token });

  return res.redirect(
    `${process.env.FRONTEND_URL}/google-redirect/?token=${token}&name=${user.name}&email=${user.email}`,
  );
  //  } else {
  //    return res.redirect(`${process.env.FRONTEND_URL}/register`);
  //  }
};

function genPass() {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var passwordLength = 12;
  var password = '';

  for (var i = 0; i <= passwordLength; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }
  return password;
}

module.exports = { googleAuth, googleRedirect };
