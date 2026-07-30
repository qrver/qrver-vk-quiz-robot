/*
  Warnings:

  - You are about to drop the column `editing_question` on the `user_sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."user_sessions" DROP COLUMN "editing_question";
