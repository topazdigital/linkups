import { Router, type IRouter } from "express";
import { UploadAdminImagesResponse } from "@workspace/api-zod";
import {
  isMulterError,
  parseAdminImageUpload,
  publishAdminImages,
  UnsupportedImageTypeError,
} from "../lib/linkups-uploads";
import { requireAdmin } from "../middleware/admin-auth";

const router: IRouter = Router();

router.post("/admin/uploads", requireAdmin, (req, res, next) => {
  parseAdminImageUpload(req, res, (error) => {
    if (error) {
      if (isMulterError(error)) {
        const tooLarge = error.code === "LIMIT_FILE_SIZE";
        req.log.warn({ code: error.code }, "Admin image upload was rejected");
        res.status(tooLarge ? 413 : 400).json({
          error: tooLarge
            ? "Each image must be 12 MB or smaller."
            : "Choose up to 8 images at a time.",
        });
        return;
      }
      if (error instanceof UnsupportedImageTypeError) {
        req.log.warn("Admin image upload used an unsupported file type");
        res.status(415).json({ error: error.message });
        return;
      }
      next(error);
      return;
    }

    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) {
      res.status(400).json({ error: "Choose at least one image to upload." });
      return;
    }

    void publishAdminImages(files)
      .then((urls) => {
        res.json(UploadAdminImagesResponse.parse({ urls }));
      })
      .catch((uploadError: unknown) => {
        if (uploadError instanceof UnsupportedImageTypeError) {
          req.log.warn("Admin image upload content was not a supported image");
          res.status(415).json({ error: uploadError.message });
          return;
        }
        next(uploadError);
      });
  });
});

export default router;
