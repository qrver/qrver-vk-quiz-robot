-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'NOT_ACTIVATED',
    "answer_1" TEXT,
    "answer_2" TEXT,
    "answer_3" TEXT,
    "answer_4" TEXT,
    "answer_5" TEXT,
    "registration_name" TEXT,
    "registration_city" TEXT,
    "registration_company" TEXT,
    "registration_workplace" TEXT,
    "editing_question" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quiz_answers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_number" INTEGER NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_registrations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "workplace" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_user_id_key" ON "public"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "quiz_answers_user_id_idx" ON "public"."quiz_answers"("user_id");

-- CreateIndex
CREATE INDEX "quiz_answers_question_number_idx" ON "public"."quiz_answers"("question_number");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_answers_user_id_question_number_key" ON "public"."quiz_answers"("user_id", "question_number");

-- CreateIndex
CREATE UNIQUE INDEX "user_registrations_user_id_key" ON "public"."user_registrations"("user_id");

-- AddForeignKey
ALTER TABLE "public"."quiz_answers" ADD CONSTRAINT "quiz_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_sessions"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_registrations" ADD CONSTRAINT "user_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_sessions"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
