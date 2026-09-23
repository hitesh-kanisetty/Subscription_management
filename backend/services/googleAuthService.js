const { google } = require("googleapis");

const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const getGoogleAuthUrl = () => {
  return googleOAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
};

const getGoogleUser = async (code) => {
  const { tokens } = await googleOAuth2Client.getToken(code);

  googleOAuth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: googleOAuth2Client,
    version: "v2",
  });

  const { data } = await oauth2.userinfo.get();

  return {
    googleId: data.id,
    name: data.name,
    email: data.email,
    picture: data.picture,
  };
};

module.exports = {
  getGoogleAuthUrl,
  getGoogleUser,
};