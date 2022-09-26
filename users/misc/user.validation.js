const emailValidator = require("email-validator");
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

const validateRegister = ({
  // email,
  phone,
  phone_code,
  name,
  last_name,
  username,
  password,
  birthday,
}) => {
  //validate email
  if (!(typeof email === "string" && validator.validate(email)))
    throw "Invalid email";
  //validate password
  if (!(typeof password === "string" && passwordSchema.validate(password)))
    throw "Invalid password, must contain between 4 and 16 characters";
  //validate phone number
  if (
    !(
      typeof phone === "number" &&
      parseInt(phone) === phone &&
      phone.toString().length === 10
    )
  )
    throw "Invalid phone number";
  //validate phone area code
  if (
    !(
      typeof phone_code === "number" &&
      parseInt(phone_code) === phone_code &&
      phone_code.toString().length <= 3
    )
  )
    throw "Invalid phone area code";
  //validate name
  if (!(typeof name === "string" && name.length > 2 && name.length < 50))
    throw "Invalid name, must be between 2 and 50 characters long";
  //validate last name
  if (
    !(
      typeof last_name === "string" &&
      last_name.length > 2 &&
      last_name.length < 30
    )
  )
    throw "Invalid name, must be between 2 and 50 characters long";

  //validate username
  const userNamePattern = /^[a-z0-9]+$/;
  if (
    !(
      typeof username === "string" &&
      username.length >= 6 &&
      username.length <= 20 &&
      userNamePattern.test(username)
    )
  )
    return error = {
      message : "Invalid username, should be between 6 and 20 alphanumeric lowercase characters",
      errorCode : 'R003'
    }
  //validate date
  if (
    !(
      validateDate(birthday, "boolean", "mm/dd/yyyy") &&
      Date.parse(birthday) < over18
    )
  )
    throw "Must be over 18 to register";

  return true;
};

const validateVerify = ({ token }) => {
  if (!(typeof token === "string" && token.length === 4)) throw "Invalid token";
  return true;
};

const validateResendVerify = ({ verifyParam }) => {
  // if (!(typeof verifyParam === "string" && validator.validate(verifyParam)))
  //   throw "Invalid email(phone)";
  return true;
};

const validateAuthenticate = ({ username, password }) => {
  const userNamePattern = /^[a-z0-9]+$/;
  if (
    !(
      typeof username === "string" &&
      username.length >= 6 &&
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
      username.length >= 6 &&
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
  validateVerify,
  validateResendVerify,
  validateAuthenticate,
  validateForgotPw,
  validateForgotPwUpdate,
  validatePasswordChange,
};
