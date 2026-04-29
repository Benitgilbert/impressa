import express from "express";
import * as abonneController from "../controllers/abonneController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware(["admin", "seller"]), abonneController.getAbonnes);
router.post("/", authMiddleware(["admin", "seller"]), abonneController.createAbonne);
router.put("/:id", authMiddleware(["admin", "seller"]), abonneController.updateAbonne);
router.delete("/:id", authMiddleware(["admin", "seller"]), abonneController.deleteAbonne);

router.get("/:id/fiche", authMiddleware(["admin", "seller"]), abonneController.getAbonneFiche);
router.post("/:id/pay", authMiddleware(["admin", "seller"]), abonneController.payAbonneDebt);

// Contract Prices
router.get("/:id/prices", authMiddleware(["admin", "seller"]), abonneController.getContractPrices);
router.post("/:id/prices", authMiddleware(["admin", "seller"]), abonneController.updateContractPrice);
router.delete("/:id/prices/:priceId", authMiddleware(["admin", "seller"]), abonneController.deleteContractPrice);

export default router;
