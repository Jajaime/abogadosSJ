import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const demanda = await prisma.demanda.create({
        data: req.body,
      });
      res.status(200).json(demanda);
    } catch (error) {
      console.error("Error al registrar la demanda:", error);
      res.status(500).json({ error: "No se pudo registrar la demanda" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
