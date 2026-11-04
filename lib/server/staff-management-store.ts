import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { createStaffManagementStore } from "@/lib/server/staff-management-core";
export const staffManagementStore=createStaffManagementStore({db:adminDb,serverTimestamp:()=>FieldValue.serverTimestamp()});