var express = require("express");
var bodyParser = require("body-parser");
const authenticate = require("../config/authenticate");
var multer = require("multer");
const cors = require("./cors");
const { urlencoded } = require("express");
const Image = require("../models/uploads");
const fs = require("fs");
const path = require("path");
const Resize = require("../components/Resize");

// multer property to store assets from incoming request on Disk
var storage = (ext) =>
  multer.diskStorage({
    destination: (req, file, callback) => {
      // params are
      // 1. err
      // 2. image destination folder
      callback(null, `public/images/${ext}`);
    },
    filename: (req, file, callback) => {
      callback(null, file.originalname);
    },
  });

// defines the filters => type of files acceptable to store on disk
const imageFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("You can upload only image files"), false);
  }
  cb(null, true);
};

const upload = () =>
  multer({
    limits: {
      fileSize: 100 * 1920 * 1920,
    },
  });

var uploadRouter = express.Router();
uploadRouter.use(bodyParser.json());

/* api endpoint for /leaders */

uploadRouter
  .route("/recipe")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(
    cors.cors,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    async (req, res, next) => {
      res.statusCode = 403;
      res.end("GET operation not supported on /imageUpload");
    }
  )
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    upload().single("file"),
    async (req, res, next) => {
      if (!req.file) {
        return res.status(401).json({ error: "Please provide an image" });
      }
      var imagePath = path.join(__dirname, "..", "public/images/recipes");
      var nameSplit = req.file.originalname.split(".");
      var imageExt = nameSplit[nameSplit.length - 1];
      const fileUpload = new Resize(imagePath, imageExt, 1920, 1440);
      const filename = await fileUpload.save(req.file.buffer);
      return res.status(200).json({
        name: filename,
        url: `https://${req.hostname}:3000/images/${req.query.folder}/${filename}`,
      });
    }
  )
  .put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end("PUT operation not supported on /imageUpload");
  })
  .delete(
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("DELETE operation not supported on /imageUpload");
    }
  );

module.exports = uploadRouter;
