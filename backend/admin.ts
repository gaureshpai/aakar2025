"use server"
import { Prisma } from "@prisma/client";
import { db } from ".";
import { auth } from "../auth";


export async function isAdmin(email?: string) {
    try {
        if (email) {
            return !!(await db.admin.findUnique({
                where: {
                    email: email.toLowerCase()
                }
            }))
        }
        let session = await auth();
        if (!session || !session.user || !session.user.email) return false;
        let user = await db.admin.findUnique({
            where: {
                email: session.user.email
            }
        });
        return !!user;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function getAdmins() {
    if (!await isAdmin()) return null;
    return await db.admin.findMany()
}

export async function getAdmin(id: string) {
    if (!await isAdmin()) return null;
    return await db.admin.findUnique({
        where: {
            id: id
        },
        omit: {
            password: true
        }
    })
}

export async function createAdmin(admin: Prisma.AdminCreateInput) {
    if (!await isAdmin()) return null;
    return await db.admin.create({
        data: { ...admin, email: admin.email.toLowerCase() }
    })
}

export async function deleteAdmin(id: string) {
    if (!await isAdmin()) return null;
    return await db.admin.delete({
        where: {
            id: id
        }
    })
}

export async function updateAdmin(id: string, admin: Prisma.AdminUpdateInput) {
    if (!await isAdmin()) return null;
    return await db.admin.update({
        where: {
            id: id
        },
        data: { ...admin, email: (admin.email as string)?.toLowerCase() || undefined }
    })
}

export async function verifyAdmin(email: string, password: string) {
    try {

        const ad = await db.admin.findUnique({
            where: {
                email: email.toLowerCase(),
                password: password
            },
        })
        if (!ad) return null;
        let { password: pass, ...rest } = ad;
        if (password === pass) return rest;
        else return null;
    } catch (e) {
        console.log(e);
        return null;
    }
}