const config = require("config.js");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const db = require("_helpers/db");
const Admin = db.Admin;
const sendEmail = require("_helpers/send-email");

module.exports = {
  authenticate,
  getAdmin,
  getById,
  getAll,
  create,
  forgotPasswordRequest,
  forgotPasswordUpdate,
  changePassword,
};

//LOGIN

async function authenticate({ username, password }) {
  const admin = await Admin.findOne({ username });

  if (admin && bcrypt.compareSync(password, admin.password)) {
    const token = jwt.sign({ sub: admin.id, admin: true }, config.secret, {
      expiresIn: "90d",
    });

    const { password, forgot_pw_token, ...response } = { ...admin.toJSON() };
    return {
      ...response,
      token,
    };
  }
}

async function getAdmin(token) {

  let adminId = '';

  if (token) { //retrieves the admin ID from the token

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        throw 'error: ' + err;
      } else {
        adminId = decoded.sub;
      }
    });
  } else throw 'please provide a bearer token.';

  const admin = await Admin.findOne({_id : adminId})

  if (!admin) return 'Invalid token.'; //this is the message that we get when we try to use a non-admin token

  return {
    email : admin.email,
    username : admin.username,
    id : admin.id,
    token : token
  };

}

async function getById(id) {
  return await Admin.findById(id);
}

async function getAll() {
  return await Admin.find();
}

//GENERATE TOKENS (not authentication tokens, verify email and forgot pw tokens)
function randomTokenString() {
  return crypto.randomBytes(2).toString("hex");
}

//REGISTER
async function create(params) {
  const adminExists = await getAll();

  if (adminExists.length > 0) {
    throw "Only one Admin can be registered";
  }

  const admin = new Admin(params);

  if (params.password) {
    admin.password = bcrypt.hashSync(params.password, 10);
  }

  await admin.save();
  const { password, forgot_pw_toke, ...response } = { ...admin.toJSON() };
  return response;
}

//FORGOT PW

async function forgotPasswordRequest({ username }) {
  const admin = await Admin.findOne({ username });
  if (!admin) throw "Not found";

  admin.forgot_pw_token = randomTokenString();

  await sendEmail({
    to: admin.email,
    subject: "forgot password",
    html: `<p>password reset token: ${admin.forgot_pw_token}</p>`,
  });

  await admin.save();
}

async function forgotPasswordUpdate(params) {
  const admin = await Admin.findOne({ forgot_pw_token: params.token });

  if (!admin) throw "Not found/invalid token";

  if (params.password != params.confirm_password)
    throw "Passwords do not match";

  if (params.password) {
    admin.password = bcrypt.hashSync(params.password, 10);
  }
  admin.forgot_pw_token = null;

  await admin.save();
}

async function changePassword(admin_id, password, newPassword) {
  const admin = await Admin.findOne({ _id: admin_id });
  if (!admin) throw "Not found";

  if (admin && bcrypt.compareSync(password, admin.password)) {
    admin.password = bcrypt.hashSync(newPassword, 10);

    await admin.save();
  } else {
    throw "Password doesn't match";
  }
}
