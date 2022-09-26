const expressJwt = require("express-jwt");
const config = require("config.js");
const userService = require("../users/user.service");
const adminService = require("../admin/admin.service");

module.exports = jwt;

function jwt() {
  const secret = config.secret;
  return expressJwt({
    secret,
    algorithms: ["HS256"],
    requestProperty: "user",
    isRevoked,
  }).unless({
    path: [
      // public routes that don't require authentication
      "/api/users/authenticate",
      "/api/users/register",
      "/api/users/forgotPasswordRequest",
      "/api/users/forgotPasswordTokenOnly",
      "/api/users/forgotPasswordUpdate",
      "/api/users/verify",
      "/api/users/resendVerify",
      "/api/admin/authenticate",
      "/api/admin/register",
      "/api/admin/forgotPasswordRequest",
      "/api/admin/forgotPasswordTokenOnly",
      "/api/admin/forgotPasswordUpdate",
    ],
  });
}

async function isRevoked(req, payload, done) {
  const user = await userService.getById(payload.sub);
  const admin = await adminService.getById(payload.sub);

  // revoke token if user no longer exists
  if (!user && !admin) {
    return done(null, true);
  }

  done();
}
