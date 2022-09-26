const config = require("config.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("_helpers/db");
const User = db.User;
const Profile = db.Profile;
const Chat = db.Chat;
const Message = db.Message;
const secret = process.env.JWT_SECRET;
const sms = require('../_helpers/sms');
const push = require('../_helpers/push');

module.exports = {
  addDeviceToken,
  newMessagePush,
  authenticate,
  deleteUser,
  getUserId,
  getAll,
  getById,
  create,
  resendVerify,
  verify,
  forgotPasswordRequest,
  forgotPasswordTokenOnly,
  forgotPasswordUpdate,
  changePassword,
};

//push notifications

async function addDeviceToken(userToken, deviceToken) {

  if (!deviceToken) return 'Please, provide a device token';

  let user;

  if (userToken) user = jwt.verify(userToken, secret);
  else return 'Please, provide a user token)';

  //console.log(user)

  const updatedUser = await User.updateOne({ _id: user.sub }, { deviceToken: deviceToken })
    .then((user) => user)
    .catch((err) => err);


  return {
    modified: updatedUser.nModified,
    ok: updatedUser.ok,
    token: deviceToken
  };

}

async function newMessagePush(id, dataParams) {

  const user = await User.findOne({ _id: id });

  if (!user) return 'Receiver ID invalid.';
  if (!user.deviceToken) return `User doesn't have a device token stored.`

  const notification = await push.send(user.deviceToken, dataParams)
    .then((ticket) => ticket)
    .catch((err) => err);

  return notification;

}

//LOGIN

async function authenticate({ username, password }) {
  const user = await User.findOne({ username });

  if (user && bcrypt.compareSync(password, user.password)) {

    if (!user.verified) return { verified: user.verified };

    const token = jwt.sign({ sub: user.id }, config.secret, {
      expiresIn: "90d",
    });

    if (!user.profileCreated) return { 

      profileCreated: user.profileCreated, 
      token

    };    

    const { password, verification_token, ...response } = { ...user.toJSON() };
    return {
      ...response,
      token,
    };
  }
}

async function deleteUser(id) {

  let deleted = false;

  const message = await Message.deleteMany({ sender: id });

  const chat = await Chat.deleteMany({ members: id });

  const profile = await Profile.deleteOne({ user_id: id });

  const user = await User.deleteOne({ _id: id });

  if (profile && user) deleted = true;

  return deleted;
}

async function getUserId(token) {

  let userId = '';

  if (token) {

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        throw 'error: ' + err;
      } else {
        userId = decoded.sub;
      }
    });
  }

  return userId;

}

//
async function getAll() {
  return await User.find();
}
//
async function getById(id) {
  return await User.findById(id);
}

//GENERATE TOKENS (not authentication tokens, verify email and forgot pw tokens).
function randomTokenString() {
  return crypto.randomBytes(2).toString("hex");
}

//REGISTER
async function create(userParam) {
  if (
    await User.findOne({
      full_phone_number: parseInt(
        userParam.phone_code.toString() + userParam.phone.toString()
      ),
    })
  ) {

    return error = {
      message: "Phone already in use",
      errorCode: 'R001'
    }
  }

  if (
    await User.findOne({ username: userParam.username })
  ) {
    return error = {
      message: "Username already in use",
      errorCode: 'R002'
    }
  }

  const full_name = userParam.name + ' ' + userParam.last_name;

  const full_phone_number = parseInt(
    userParam.phone_code.toString() + userParam.phone.toString()
  );

  const user = new User({ ...userParam, full_name, full_phone_number });

  if (userParam.password) {
    user.password = bcrypt.hashSync(userParam.password, 10);
  }

  user.verification_token = randomTokenString();

  await sms.send(user.verification_token, user.full_phone_number);

  await user.save();
  const { password, verification_token, ...response } = { ...user.toJSON() };
  return response;
}

//VERIFY EMAIL, RESEND VERIFY

async function resendVerify({ verifyParam }) {
  const user = await db.User.findOne({ username: verifyParam });

  if (!user) throw "User not found";
  if (user.verified) return { verified: user.verified };

  user.verification_token = randomTokenString();

  await sms.send(user.verification_token, user.full_phone_number);

  await user.save();
}

async function verify({ token }) {
  const user = await db.User.findOne({ verification_token: token });

  if (!user) throw "User not found/invalid token";

  user.verified = true;
  user.verification_token = undefined;
  await user.save();

  const jwtToken = jwt.sign({ sub: user.id }, config.secret, {
    expiresIn: "90d",
  });

  const { password, verification_token, ...response } = { ...user.toJSON() };
  return {
    jwtToken,
    ...response
  };
}

//FORGOT PW

async function forgotPasswordRequest({ username }) {
  const user = await db.User.findOne({ username });
  if (!user) throw "User not found";

  user.forgot_pw_token = randomTokenString();

  await user.save();
}

async function forgotPasswordTokenOnly(userParam) {
  const user = await db.User.findOne({ forgot_pw_token: userParam.token });
  if (!user) throw "User not found/invalid token";

  return;
}

async function forgotPasswordUpdate(userParam) {
  const user = await db.User.findOne({ forgot_pw_token: userParam.token });

  if (!user) throw "User not found/invalid token";

  if (userParam.password != userParam.confirm_password)
    throw "Passwords do not match";

  if (userParam.password) {
    user.password = bcrypt.hashSync(userParam.password, 10);
  }
  user.forgot_pw_token = undefined;

  await user.save();
}

async function changePassword(user_id, password, newPassword) {
  const user = await db.User.findOne({ _id: user_id });
  if (!user) throw "User not found";

  if (user && bcrypt.compareSync(password, user.password)) {
    user.password = bcrypt.hashSync(newPassword, 10);

    await user.save();
  } else {
    throw "Password doesn't match";
  }
}
