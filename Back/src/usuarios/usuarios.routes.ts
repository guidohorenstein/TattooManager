import { Router } from "express";
import { limitarRegistro } from "../middlewares/limitar-registro.js";
import {
  register,
  registerArtist,
  verifyEmail,
  filtrarArtistas
} from "./usuarios.controller.js";

const router = Router();

router.post("/register", limitarRegistro, register);
router.post("/register-artist", limitarRegistro, registerArtist);
router.get("/verify-email", verifyEmail);
router.get("/filter-artists", filtrarArtistas);

export default router;
