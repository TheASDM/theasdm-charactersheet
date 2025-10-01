-- CreateTable
CREATE TABLE "class_spells" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "spell_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_spells_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_spells_class_id_spell_id_key" ON "class_spells"("class_id", "spell_id");

-- AddForeignKey
ALTER TABLE "class_spells" ADD CONSTRAINT "class_spells_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_spells" ADD CONSTRAINT "class_spells_spell_id_fkey" FOREIGN KEY ("spell_id") REFERENCES "spells"("id") ON DELETE CASCADE ON UPDATE CASCADE;
