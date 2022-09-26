const express = require("express");
const fs = require("fs-extra");
const multer = require("multer");
const router = express.Router();
const profileService = require("./profile.service");
const {
  validateCreate,
  validateEditProfile,
  validateUpdateGalleryBody,
  isValidObjectId,
} = require("./misc/profile.validation");

const whitelist = ["image/jpeg", "image/jpg", "image/png"];

let upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      let sub = req.user.sub;
      let path = `./uploads/${sub}`;
      fs.mkdirsSync(path);
      callback(null, path);
    },
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = file.originalname.slice(file.originalname.lastIndexOf("."));
      //originalname is the uploaded file's name with extn
      callback(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!whitelist.includes(file.mimetype)) {
      return cb(new Error("Only jpeg/jpg/png images allowed"));
    }

    cb(null, true);
  },
});

// routes
router.put("/blockUser/:blockedId", blockUser);
router.get('/getBlockedUsers', getBlockedUsers);
router.put('/unblockUser/:unblockId', unblockUser);
router.post("/create", upload.array("photos", 3), newProfile);
router.get("/", getAll);
router.post("/getNearby", getNearby)
router.get("/me", getProfile);
router.get("/:id", getById);unblockUser
router.put("/edit", editProfile);
router.put("/location", updateLocation);
router.put("/picture", upload.single("pf_photo"), newProfilePicture);
router.put("/gallery", upload.array("photos", 9), updateGallery);

module.exports = router;

//BLOCK USERS

async function blockUser(req, res, next) {
  profileService.blockUser(req.headers.authorization.split('Bearer ')[1], req.params.blockedId)
    .then((user) => {

      if (typeof (user) === 'object') res.status(200).json({ user });

      else if ((typeof (user) === 'string')) res.status(400).json({ message: user });

      else res.status(400).json({ message: 'Could not block the user.' });

    })
    .catch(err => next(err));
}

async function getBlockedUsers(req, res, next) {

  profileService.getBlockedUsers(req.headers.authorization.split('Bearer ')[1])
    .then((blockedUsers) => blockedUsers ? res.status(200).json(blockedUsers) : res.status(400).json({message : 'Could not retrieve the blocked users'}))
    .catch((err) => next(err));

}

async function unblockUser(req, res, next) {

  profileService.unblockUser(req.headers.authorization.split('Bearer ')[1], req.params.unblockId)
    .then((user) => user ? res.status(200).json(user) : res.status(400).json({message : 'Could not unblock the user'}))
    .catch((err) => next(err));

}

//Create Profile

async function newProfile(req, res, next) {
  try {
    if (req.body.age_from) req.body.age_from = parseInt(req.body.age_from);
    if (req.body.age_to) req.body.age_to = parseInt(req.body.age_to);
    const validBody = validateCreate(req.body);
    const profile = await profileService.create({
      ...req.body,
      user_id: req.user.sub,
    });
    if (profile) res.json(profile);
    else res.status(400);
  } catch (err) {
    next(err);
  }
}

async function editProfile(req, res, next) {
  try {
    if (req.body.age_from) req.body.age_from = parseInt(req.body.age_from);
    if (req.body.age_to) req.body.age_to = parseInt(req.body.age_to);
    const validBody = validateEditProfile(req.body);
    const profile = await profileService.edit({
      ...req.body,
      user_id: req.user.sub,
    });
    if (profile) res.json(profile);
    else res.status(400).json({ message: "The profile doesn't exist" });
  } catch (err) {
    next(err);
  }
}

async function updateLocation(req, res, next) {
  try {
    if (!req.body.latitude || !req.body.longitude)
      return res.status(400).json({ message: "Missing fields" });

    const profile = await profileService.updateLocation({
      ...req.body,
      user_id: req.user.sub,
    });
    if (profile) res.json(profile);
    else res.status(400).json({ message: "The profile doesn't exist" });
  } catch (err) {
    next(err);
  }
}

async function newProfilePicture(req, res, next) {
  try {
    const profile = await profileService.updateProfilePicture(req.user.sub);
    if (profile) res.json(profile);
    else res.status(400).json({ message: "An error has occurred" });
  } catch (err) {
    next(err);
  }
}

async function updateGallery(req, res, next) {
  try {
    const validBody = validateUpdateGalleryBody(req.body);
    const profile = await profileService.updateGallery({
      ...req.body,
      user_id: req.user.sub,
    });
    if (profile) res.json(profile);
    else res.status(400).json({ message: "An error has occurred" });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const profile = await profileService.getById(req.user.sub);
    if (profile) res.json(profile);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const profiles = await profileService.getAll(req.user.sub);
    if (profiles) res.json(profiles);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}

async function getNearby(req, res, next) {
  try {

    if (!req.body.latitude || !req.body.longitude)
      return res.status(400).json({ message: "Missing fields" });

    const profiles = await profileService.getNearby(req.user.sub, req.body.longitude, req.body.latitude, req.body.filter);
    if (profiles) res.json(profiles);
    else res.sendStatus(400);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) throw "Invalid id";
    const profile = await profileService.getById(req.params.id);
    if (profile) res.json(profile);
    else res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}
