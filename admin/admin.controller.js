const express = require("express");
const router = express.Router();
const adminService = require("./admin.service");
const {
  validateRegister,
  validateAuthenticate,
  validateForgotPw,
  validateForgotPwUpdate,
  validatePasswordChange,
} = require("./misc/admin.validation");

// routes
router.post("/authenticate", authenticate);
router.post("/register", register);
router.get('/getAdmin', getAdmin)
// router.get("/me", getAuthenticatedUser);
router.post("/forgotPasswordRequest", forgotPasswordRequest);
router.put("/forgotPasswordUpdate", forgotPasswordUpdate);
router.put("/passwordChange", passwordChange);

module.exports = router;

//REGISTER, LOGIN

async function authenticate(req, res, next) {
  try {
    const validBody = validateAuthenticate(req.body);
    const admin = await adminService.authenticate(req.body);

    if (admin) res.json(admin);
    else res.status(400).json({ message: "user or password incorrect" });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const validBody = validateRegister(req.body);
    const admin = await adminService.create(req.body);
    if (admin) res.json(admin);
    else res.status(400).json({ message: "email in use. Try a different one" });
  } catch (err) {
    next(err);
  }
}

//retrieve admin

async function getAdmin(req, res, next) {

  adminService.getAdmin(req.headers.authorization.split('Bearer ')[1])
    .then((admin) => typeof(admin) === 'object' ? res.status(200).json(admin) : res.status(400).json({message : admin}))
    .catch((err) => next(err));

}

// async function getAuthenticatedUser(req, res, next) {
//   try {
//     const user = await userService.getById(req.user.sub);
//     if (user) res.json(user);
//     else res.sendStatus(404);
//   } catch (err) {
//     next(err);
//   }
// }

//FORGET PW

async function forgotPasswordRequest(req, res, next) {
  try {
    const validBody = validateForgotPw(req.body);
    await adminService.forgotPasswordRequest(req.body);
    res.json({ message: "token sent" });
  } catch (err) {
    next(err);
  }
}

async function forgotPasswordUpdate(req, res, next) {
  try {
    const validBody = validateForgotPwUpdate(req.body);
    await adminService.forgotPasswordUpdate(req.body);
    res.json({ message: "password updated" });
  } catch (err) {
    next(err);
  }
}

async function passwordChange(req, res, next) {
  try {
    const validBody = validatePasswordChange(req.body);
    await adminService.changePassword(
      req.user.sub,
      req.body.password,
      req.body.new_password
    );
    res.json({ message: "password updated" });
  } catch (err) {
    next(err);
  }
}
