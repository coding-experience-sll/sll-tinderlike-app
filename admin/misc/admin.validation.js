const validator = require("email-validator");
const passwordValidator = require("password-validator");
const validateDate = require("validate-date");
const passwordSchema = new passwordValidator();

const over18 = Date.now() - 1000 * 60 * 60 * 24 * 365.25 * 18;

passwordSchema
  .is()
  .min(4) // Minimum length 8
  .is()
  .max(16) // Maximum length 100
  // .has()
  // .uppercase() // Must have uppercase letters
  // .has()
  // .lowercase() // Must have lowercase letters
  // .has()
  // .digits() // Must have at least 2 digits
  .has()
  .not()
  .spaces(); // Should not have spaces
//.is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

const validateRegister = ({ email, username, password }) => {
  //validate email
  if (!(typeof email === "string" && validator.validate(email)))
    throw "Invalid email";
  //validate password
  if (!(typeof password === "string" && passwordSchema.validate(password)))
    throw "Invalid password, must contain between 4 and 16 characters";

  //validate username
  const userNamePattern = /^[a-z0-9]+$/;
  if (
    !(
      typeof username === "string" &&
      username.length >= 5 &&
      username.length <= 20 &&
      userNamePattern.test(username)
    )
  )
    throw "Invalid username, should be between 5 and 20 alphanumeric lowercase characters";

  return true;
};

const validateAuthenticate = ({ username, password }) => {
  const userNamePattern = /^[a-z0-9]+$/;
  if (
    !(
      typeof username === "string" &&
      username.length >= 5 &&
      username.length <= 20 &&
      userNamePattern.test(username)
    )
  )
    throw "Invalid username";

  if (!(typeof password === "string" && passwordSchema.validate(password)))
    throw "Invalid password";
  return true;
};

const validateForgotPw = ({ username }) => {
  const userNamePattern = /^[a-z0-9]+$/;
  if (
    !(
      typeof username === "string" &&
      username.length >= 5 &&
      username.length <= 20 &&
      userNamePattern.test(username)
    )
  )
    throw "Invalid username";
  return true;
};

const validateForgotPwUpdate = ({ token, password, confirm_password }) => {
  if (!(typeof token === "string" && token.length === 4)) throw "Invalid token";

  if (!(typeof password === "string" && passwordSchema.validate(password)))
    throw "Invalid password, must contain between 4 and 16 characters";
  if (!(password === confirm_password)) throw "Passwords don't match";
  return true;
};

const validatePasswordChange = ({ password, new_password }) => {
  if (!(typeof password === "string" && passwordSchema.validate(password)))
    throw "Invalid password, must contain between 4 and 16 characters";
  if (
    !(typeof new_password === "string" && passwordSchema.validate(new_password))
  )
    throw "Invalid new password, must contain between 4 and 16 characters";
  return true;
};

module.exports = {
  validateRegister,
  validateAuthenticate,
  validateForgotPw,
  validateForgotPwUpdate,
  validatePasswordChange,
};
