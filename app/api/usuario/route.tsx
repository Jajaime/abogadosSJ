import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Método para crear un usuario (POST)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name } = body;

        if (!email) {
            return NextResponse.json({ error: "El email es obligatorio" }, { status: 400 });
        }

        const newUser = await prisma.usuario.create({
            data: { email, name },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }
}

// Método para obtener usuarios (GET)
export async function GET() {
    try {
        const users = await prisma.usuario.findMany();
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
    }
}

