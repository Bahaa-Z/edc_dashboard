import { Router } from "express";
import { jwtCheck } from "../client/src//auth/jwt";
import { hasRole } from "../client/src/auth/roles"; 

const router = Router();

router.post("/deploy/edc", jwtCheck, (req, res) => {
  if (!hasRole(req, "provider")) return res.status(403).json({ error: "forbidden" });
  // TODO: do actual deploy
  res.json({ ok: true });
});

export default router;