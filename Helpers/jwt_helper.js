const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const User = require("../models/user.model");
const mongoose = require("mongoose");

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "30d",
        issuer: process.env.DOMAIN,
        audience: userId.toString(),
      };
      console.log("Access token secret:", secret);
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err);
          reject(createError.InternalServerError());
          return;
        }
        resolve(token);
      });
    });
  },
  verifyAccessToken: async (req, res, next) => {
    try {
      if (!req.headers.authorization) {
        return next(createError.Unauthorized("No authorization header"));
      }

      const authHeader = req.headers.authorization;
      const token = authHeader.split(" ")[1];

      if (!token) {
        return next(createError.Unauthorized("Unauthorized"));
      }

      JWT.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        async (err, payload) => {
          if (err) {
            return next(
              createError.Unauthorized(
                err.name === "JsonWebTokenError" ? "Unauthorized" : err.message
              )
            );
          }

          const user = await User.findById(payload.aud);
          if (!user) {
            return next(createError.Unauthorized("User not found"));
          }

          req.user = user;
          req.payload = payload;
          next();
        }
      );
    } catch (err) {
      next(err);
    }
  },
  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN_SECRET;
      const options = {
        expiresIn: "1y",
        issuer: process.env.DOMAIN,
        audience: userId.toString(),
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          reject(createError.InternalServerError());
        }

        resolve(token);
      });
    });
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized());
          const userId = payload.aud;
          resolve(userId);
        }
      );
    });
  },
};
