const ObjectId = require("mongoose").Types.ObjectId;

const isValidObjectId = (id) => {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) return true;
    return false;
  }
  return false;
};

const validateCreate = ({
  interests,
  looking_for,
  age_from,
  age_to,
  gender,
}) => {
  //validate interests function
  const validateInterests = (interests) => {
    const array = Array(interests);
    if (
      !(
        array[0] != undefined &&
        array.length > 0 &&
        array.length <= 6
      )
    )
      throw "Invalid list of interests, at least 1 and maximum 6";
    for (let i = 0; i < interests.length; i++) {
      if (!(typeof interests[i] === "string"))
        throw "invalid data inside the list, should be string";
    }
  };
  //validate age_to & age_from function
  const validateAgeRelated = (age_from, age_to) => {
    if (!(typeof age_from === "number" && typeof age_to === "number"))
      throw "invalid types for age_from or age_to, should be number";
    if (!(age_from >= 18 && age_from <= 100 && age_to >= 18 && age_to <= 100))
      throw "Invalid values for age_from or age_to, should be between 18 and 100";
    if (!(age_from <= age_to))
      throw "age_from must be lower or equal than age_to and higher than 17";
  };

  //validate interests
  validateInterests(interests);

  // validate age_from && age_to
  validateAgeRelated(age_from, age_to);

  //validate looking_for

  if (
    !(
      typeof looking_for === "string" &&
      (looking_for === "Male" ||
        looking_for === "Female" ||
        looking_for === "Both")
    )
  )
    throw "Invalid looking_for , should be either Male , Female or Both";

  //validate gender
  if (
    !(typeof gender === "string" && (gender === "Male" || gender === "Female"))
  )
    throw "Invalid gender";

  return true;
};

const validateEditProfile = ({ interests, looking_for, age_from, age_to }) => {
  //validate interests function
  const validateInterests = (interests) => {

    if (interests) {
      if (
        !(
          (Array.isArray(interests) &&
            interests.length > 0 &&
            interests.length <= 6) ||
          interests === undefined
        )
      )
        throw "Invalid list of interests, at least 1 and maximum 6";
      for (let i = 0; i < interests.length; i++) {
        if (!(typeof interests[i] === "string"))
          throw "invalid data inside the list, should be string";
      }
    }

  };
  //validate age_to & age_from function
  const validateAgeRelated = (age_from, age_to) => {
    if (age_to, age_from) {
      if (
        !(
          (typeof age_from === "number" && typeof age_to === "number") ||
          (age_from === undefined && age_to === undefined)
        )
      )
        throw "invalid types for age_from or age_to, should be number";
      if (!(age_from >= 18 && age_from <= 100 && age_to >= 18 && age_to <= 100))
        throw "Invalid values for age_from or age_to, should be between 18 and 100";
      if (!(age_from <= age_to))
        throw "age_from must be lower or equal than age_to and higher than 17";
    }

  };

  //validate interests
  validateInterests(interests);

  // validate age_from && age_to
  validateAgeRelated(age_from, age_to);

  //validate looking_for

  if (
    !(
      (typeof looking_for === "string" &&
        (looking_for === "Male" ||
          looking_for === "Female" ||
          looking_for === "Both")) ||
      looking_for === undefined
    )
  )
    throw "Invalid looking_for , should be either Male , Female or Both";

  return true;
};

const validateUpdateGalleryBody = ({ remove_photos }) => {
  const validateIds = (remove_photos) => {
    if (!(Array.isArray(remove_photos) && remove_photos.length <= 9))
      throw "Invalid list of photos";
    for (let i = 0; i < remove_photos.length; i++) {
      if (!isValidObjectId(remove_photos[i]))
        throw "invalid id inside the list";
    }
  };
  validateIds(remove_photos);
  return true;
};

module.exports = {
  validateCreate,
  validateEditProfile,
  validateUpdateGalleryBody,
  isValidObjectId,
};
