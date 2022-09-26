const db = require("_helpers/db");
const fs = require("fs-extra");
const path = require("path");
const mongoose = require("mongoose");
const crypto = require("crypto");
const User = db.User;
const Profile = db.Profile;
const { uploadFile } = require("./../s3"); // for aws upload
const chatService = require('../chats/chat.service');
const userService = require('../users/user.service');

module.exports = {
  blockUser,
  getBlockedUsers,
  unblockUser,
  getAll,
  getById,
  getNearby,
  create,
  edit,
  updateProfilePicture,
  updateGallery,
  updateLocation,
};

//block other users

async function blockUser(token, blockedId) { //requires the user's token and a id to block (via params)

  if (!token) throw 'Please, provide a JWT token.';

  const userId = await userService.getUserId(token);

  const user = await Profile.findOne({ user_id: userId });

  if (!user) throw 'User id is invalid.';

  let blockedIndex = user.blockedList.findIndex(p => p == blockedId)

  if (blockedIndex > -1) return 'User has already been blocked';

  else user.blockedList.push(blockedId);

  await user.save();

  return user;
}

async function getBlockedUsers(token) {

  if (!token) throw 'Please, provide a JWT token.';

  const userId = await userService.getUserId(token);

  const user = await Profile.findOne({ user_id: userId });

  if (!user) throw 'User id is invalid.';

  const blockedUsers = await Profile.find({ user_id: { $in: user.blockedList } });

  if (!blockedUsers) throw 'there are no blocked users';

  return blockedUsers;

}

async function unblockUser(token, unblockId) {

  //console.log(unblockId)

  if (!token) throw 'Please, provide a JWT token.';

  const userId = await userService.getUserId(token);

  const user = await Profile.findOne({ user_id: userId });

  if (!user) throw 'User id is invalid.';

  if (!unblockId) throw 'please provide a user id to unblock';

  user.blockedList.pull(unblockId);

  await user.save()

  return user;

}

async function getAll(id) {
  return await Profile.find({ user_id: { $ne: id } });
}

async function getById(id) {
  return await Profile.findOne({ user_id: id });
}

async function getNearby(id, longitude, latitude, filter) {//returns nearby users using location and all of the users interests. removes blocked users and users that blocked you

  const user = await Profile.findOne({ user_id: id });

  if (!user) throw 'user not found';

  const coordinates = [longitude, latitude];

  let genderQuery;

  user.looking_for == 'Both' ? genderQuery = ['Male', 'Female'] : genderQuery = user.looking_for;

  user.location.coordinates = coordinates;

  await user.save();

  const profiles = await Profile.find({
    $and: [
      {
        location: {
          $near: {
            $maxDistance: 12500,
            $geometry: {
              type: "Point",
              coordinates: coordinates,
              index: "2dsphere"
            }
          }
        }
      },
      { user_id: { $ne: id } },
      { gender: { $in: genderQuery } },
      {
        $expr: {
          $cond: {
            if: { looking_for: { $not: 'Both' } },
            then: { looking_for: user.gender },
            else: {
              $or: [
                { looking_for: 'Male' },
                { looking_for: 'Female' }
              ]
            }
          }
        }
      },
      { age_from: { $lte: user.age } },
      { age_to: { $gte: user.age } }
    ]

  }).limit(20)

  const profilesFiltered = profiles.filter((profile) => { //removes people outside your age range, blocked list and other people that blocked you

    return (!(user.blockedList.includes(profile.user_id))) && (!(profile.blockedList.includes(user.user_id))) && (profile.age >= user.age_from || profile.age <= user.age_to);

  });

  if (filter) { //filter to only return users with existing chats (with you)

    const userChats = await chatService.getChats(id);

    let members = userChats.map((userChat) => userChat.members);

    let idArray = [];

    members.forEach((member) => {

      member.forEach((subMember) => {

        if (subMember._id != id) idArray.push(subMember._id.toString())

      })

    }) //optimize: map skipping an instance

    let filteredProfiles = [];

    for (const profile of profilesFiltered) {

      if (idArray.includes(profile.user_id.toString())) filteredProfiles.push(profile);

    }

    return filteredProfiles;

  }

  return profilesFiltered;

}

async function checkFileCount(user_id) {
  const uploadFolderPath = path.join(path.resolve(), `/uploads/${user_id}`);

  const images_names = await fs.readdir(uploadFolderPath);
  const result = {
    pfp_path: 0,
    images_count: 0,
  };

  for (let i = 0; i < images_names.length; i++) {
    if (images_names[i].includes("pf_photo")) {
      result.pfp_path = 1;
    } else if (images_names[i].includes("photos")) {
      result.images_count++;
    }
  }

  return result;
}

// WITH IMGUR

// async function uploadFiles(user_id) {
//   const uploadFolderPath = path.join(path.resolve(), `/uploads/${user_id}`);

//   const images_names = await fs.readdir(uploadFolderPath);
//   const array_urls = [];

//   for (let i = 0; i < images_names.length; i++) {
//     const uploadedPhoto = await imgur.uploadFile(
//       `${uploadFolderPath}/${images_names[i]}`
//     );
//     array_urls.push({
//       url: uploadedPhoto.link,
//       _id: mongoose.Types.ObjectId(crypto.randomBytes(12).toString("hex")),
//     });
//     await fs.unlink(`${uploadFolderPath}/${images_names[i]}`);
//   }

//   //fs.remove(uploadFolderPath);
//   return array_urls;
// }

// WITH AWS S3
async function uploadFiles(user_id) {
  const uploadFolderPath = path.join(path.resolve(), `/uploads/${user_id}`);

  const images_names = await fs.readdir(uploadFolderPath);
  const array_urls = [];

  for (let i = 0; i < images_names.length; i++) {
    const uploadedPhoto = await uploadFile(
      `${uploadFolderPath}/${images_names[i]}`
    );
    array_urls.push({
      url: uploadedPhoto,
      _id: mongoose.Types.ObjectId(crypto.randomBytes(12).toString("hex")),
    });
    await fs.unlink(`${uploadFolderPath}/${images_names[i]}`);
  }

  //fs.remove(uploadFolderPath);
  return array_urls;
}

// WITH IMGUR

// async function uploadEditFiles(user_id) {
//   const uploadFolderPath = path.join(path.resolve(), `/uploads/${user_id}`);

//   const images_names = await fs.readdir(uploadFolderPath);
//   const image_urls = { images: [], pfp: null };

//   for (let i = 0; i < images_names.length; i++) {
//     if (images_names[i].includes("pf_photo")) {
//       const uploadedPhoto = await imgur.uploadFile(
//         `${uploadFolderPath}/${images_names[i]}`
//       );
//       image_urls.pfp = {
//         url: uploadedPhoto.link,
//         _id: mongoose.Types.ObjectId(crypto.randomBytes(12).toString("hex")),
//       };
//     } else if (images_names[i].includes("photos")) {
//       const uploadedPhoto = await imgur.uploadFile(
//         `${uploadFolderPath}/${images_names[i]}`
//       );
//       image_urls.images.push({
//         url: uploadedPhoto.link,
//         _id: mongoose.Types.ObjectId(crypto.randomBytes(12).toString("hex")),
//       });
//     }
//     await fs.unlink(`${uploadFolderPath}/${images_names[i]}`);
//   }

//   // fs.remove(uploadFolderPath);
//   return image_urls;
// }

// WITH AWS S3
async function uploadEditFiles(user_id) {
  const uploadFolderPath = path.join(path.resolve(), `/uploads/${user_id}`);

  const images_names = await fs.readdir(uploadFolderPath);
  const image_urls = { images: [], pfp: null };

  for (let i = 0; i < images_names.length; i++) {
    if (images_names[i].includes("pf_photo")) {
      const uploadedPhoto = await uploadFile(
        `${uploadFolderPath}/${images_names[i]}`
      );
      image_urls.pfp = {
        url: uploadedPhoto,
        _id: mongoose.Types.ObjectId(crypto.randomBytes(12).toString("hex")),
      };
    } else if (images_names[i].includes("photos")) {
      const uploadedPhoto = await uploadFile(
        `${uploadFolderPath}/${images_names[i]}`
      );
      image_urls.images.push({
        url: uploadedPhoto,
        _id: mongoose.Types.ObjectId(crypto.randomBytes(12).toString("hex")),
      });
    }
    await fs.unlink(`${uploadFolderPath}/${images_names[i]}`);
  }

  // fs.remove(uploadFolderPath);
  return image_urls;
}

async function cleanPath(user_id) {
  const uploadFolderPath = path.join(path.resolve(), `/uploads/${user_id}`);

  const images_names = await fs.readdir(uploadFolderPath);

  for (let i = 0; i < images_names.length; i++) {
    await fs.unlink(`${uploadFolderPath}/${images_names[i]}`);
  }

  // cant delete the directory without having crashes sometimes and there seems to be no reliable solution

  //fs.emptyDir(uploadFolderPath, fs.remove(uploadFolderPath));
  //fs.remove(uploadFolderPath);
  return;
}

async function create(profileParam) {
  const foundUser = await User.findOne({ _id: profileParam.user_id });
  if (foundUser) {
    if (await Profile.findOne({ user_id: profileParam.user_id })) {
      await cleanPath(profileParam.user_id);
      throw "The profile for this user already exists";
    }

    const images = await uploadFiles(profileParam.user_id);
    const profile_photo = { url: images[0].url, _id: images[0]._id };
    const profile = new Profile({
      ...profileParam,
      profile_photo,
      images,
      name: foundUser.name,
      last_name: foundUser.last_name,
      birthday: foundUser.birthday,
    });

    await profile.save();

    foundUser.profileCreated = true;
    await foundUser.save();

    return { ...profile.toJSON() };
  } else throw "Couldn't find the user";
}

async function edit(profileParam) {
  const foundProfile = await Profile.findOne({ user_id: profileParam.user_id });
  if (foundProfile) {
    foundProfile.interests = profileParam.interests
      ? profileParam.interests
      : foundProfile.interests;
    foundProfile.looking_for = profileParam.looking_for
      ? profileParam.looking_for
      : foundProfile.looking_for;
    foundProfile.age_from = profileParam.age_from
      ? profileParam.age_from
      : foundProfile.age_from;
    foundProfile.age_to = profileParam.age_to
      ? profileParam.age_to
      : foundProfile.age_to;

    foundProfile.save();
    return { ...foundProfile.toJSON() };
  } else throw "The profile doesn't exist";
}

async function updateLocation(props) {
  const foundProfile = await Profile.findOne({ user_id: props.user_id });
  if (foundProfile) {

    foundProfile.location.coordinates = [props.longitude, props.latitude];

    foundProfile.save();
    return { ...foundProfile.toJSON() };

  } else throw "The profile doesn't exist";
}

async function updateProfilePicture(user_id) {
  const foundProfile = await Profile.findOne({ user_id });

  if (foundProfile) {
    //request image count
    const fileCount = await checkFileCount(user_id);

    if ((fileCount.pfp_path = 1)) {
      const newUrls = await uploadEditFiles(user_id);

      foundProfile.profile_photo = newUrls.pfp
        ? newUrls.pfp
        : foundProfile.profile_photo;
      foundProfile.save();
    } else {
      await cleanPath(user_id);
      throw "Invalid request";
    }

    return { ...foundProfile.toJSON() };
  } else throw "The profile doesn't exist";
}

async function updateGallery(profileParam) {
  const foundProfile = await Profile.findOne({ user_id: profileParam.user_id });
  if (foundProfile) {
    //request image count
    if (!Array.isArray(profileParam.remove_photos))
      profileParam.remove_photos = [];
    const fileCount = await checkFileCount(profileParam.user_id);
    // check if uploading the images would go over the maximum images per user

    if (
      fileCount.images_count >= 0 &&
      foundProfile.images.length -
      profileParam.remove_photos.length +
      fileCount.images_count <=
      9
    ) {
      let newImages = [];
      if (profileParam.remove_photos.length > 0) {
        newImages = foundProfile.images.filter((item) => {
          return !profileParam.remove_photos.includes(
            item._id.toString().replace(/ObjectId\("(.*)"\)/, "$1")
          );
        });
      } else {
        newImages = foundProfile.images;
      }

      if (newImages.length + fileCount.images_count <= 9) {
        //upload and save the images
        const newUrls = await uploadEditFiles(profileParam.user_id);
        foundProfile.images = [...newImages, ...newUrls.images];
        foundProfile.save();
      } else {
        await cleanPath(profileParam.user_id);
        throw "Maximum of images reached, delete some first A";
      }
    } else {
      await cleanPath(profileParam.user_id);
      throw "Maximum of images reached, delete some first B";
    }

    return { ...foundProfile.toJSON() };
  } else throw "The profile doesn't exist";
}
