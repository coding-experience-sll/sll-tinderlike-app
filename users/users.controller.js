const express = require("express");
const router = express.Router();
const userService = require("./user.service");
const {
  validateRegister,
  validateVerify,
  validateResendVerify,
  validateAuthenticate,
  validateForgotPw,
  validateForgotPwUpdate,
  validatePasswordChange,
} = require("./misc/user.validation");

//Server alive (requires token)
router.get("/serverAlive", (req, res) => {
  res.send("Hello World");
});

// routes
router.put("/addDeviceToken", addDeviceToken);
router.get("/newMessagePush", newMessagePush);
router.post("/authenticate", authenticate);
router.delete('/deleteUser', deleteUser);
router.get('/getUserId', getUserId);
router.post("/register", register);
router.get("/me", getAuthenticatedUser);
router.post("/resendVerify", resendVerify);
router.post("/verify", verify);
router.post("/forgotPasswordRequest", forgotPasswordRequest);
router.put("/forgotPasswordUpdate", forgotPasswordUpdate);
router.put("/passwordChange", passwordChange);

module.exports = router;



//NOTIFICATION TOKEN

function addDeviceToken(req, res, next) {
  userService.addDeviceToken(req.headers.authorization.split('Bearer ')[1], req.body.deviceToken)
    .then(updatedUser => updatedUser ? res.status(200).json({ updatedUser }) : res.status(400).json({ message: 'Could not add the device token.' }))
    .catch(err => next(err));
}

function newMessagePush(req, res, next) {
  userService.newMessagePush(req.body.receiver_id, req.body.dataParams)
    .then(updatedUser => updatedUser ? res.status(200).json({ updatedUser }) : res.status(400).json({ message: 'Could not add the device token.' }))
    .catch(err => next(err));
}

//REGISTER, LOGIN

async function authenticate(req, res, next) {
  try {
    const validBody = validateAuthenticate(req.body);
    const user = await userService.authenticate(req.body);

    if (user) res.json(user);
    else res.status(400).json({ message: "user or password incorrect" });
  } catch (err) {
    next(err);
  }
}

function deleteUser(req, res, next) {
  userService.deleteUser(req.user.sub)
    .then(deleted => deleted == true ? res.status(200).json({ message: 'User deleted' }) : res.status(400).json({ message: 'Could not delete the user.' }))
    .catch(err => next(err));
}

function getUserId(req, res, next) {
  userService.getUserId(req.headers.authorization.split(' ')[1])
    .then(res.status(200))
    .catch(err => next(err));
}

async function register(req, res, next) {
  try {
    const validBody = validateRegister(req.body);
    console.log(validBody)
    if (validBody.errorCode) {

      res
        .status(400)
        .json(validBody);
      return;

    }
    const user = await userService.create(req.body);
    if (user.errorCode) res.status(400);
    if (user) res.json(user);
    else
      res
        .status(400)
        .json({ message: "Phone number in use. Try a different one" });
  } catch (err) {
    next(err);
  }
}

async function getAuthenticatedUser(req, res, next) {
  try {
    const user = await userService.getById(req.user.sub);
    if (user) res.json(user);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}

async function resendVerify(req, res, next) {
  try {
    const validBody = validateResendVerify(req.body);
    const result = await userService.resendVerify(req.body);
    if (result && result.verified)
      return res.status(400).json({ message: "Account already verified" });
    return res.json({ message: "Verify sms resent" });
  } catch (err) {
    next(err);
  }
}

//VERIFY EMAIL

async function verify(req, res, next) {
  try {
    const validBody = validateVerify(req.body);
    const user = await userService.verify(req.body);
    if (user) res.json(user);
    else res.status(404).json({ message: "user not found/invalid token" });
  } catch (err) {
    next(err);
  }
}

//FORGET PW

async function forgotPasswordRequest(req, res, next) {
  try {
    const validBody = validateForgotPw(req.body);
    await userService.forgotPasswordRequest(req.body);
    res.json({ message: "token sent" });
  } catch (err) {
    next(err);
  }
}

async function forgotPasswordUpdate(req, res, next) {
  try {
    const validBody = validateForgotPwUpdate(req.body);
    await userService.forgotPasswordUpdate(req.body);
    res.json({ message: "password updated" });
  } catch (err) {
    next(err);
  }
}

async function passwordChange(req, res, next) {
  try {
    const validBody = validatePasswordChange(req.body);
    await userService.changePassword(
      req.user.sub,
      req.body.password,
      req.body.new_password
    );
    res.json({ message: "password updated" });
  } catch (err) {
    next(err);
  }
}
