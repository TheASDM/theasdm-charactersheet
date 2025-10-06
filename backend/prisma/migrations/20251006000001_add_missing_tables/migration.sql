-- CreateTable
CREATE TABLE "feats" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "source" VARCHAR(20),
    "page" INTEGER,
    "category" VARCHAR(10),
    "prerequisites" JSONB,
    "ability_score_increase" JSONB,
    "repeatable" BOOLEAN NOT NULL DEFAULT false,
    "entries" JSONB,
    "additional_spells" JSONB,
    "srd52" BOOLEAN,
    "basic_rules_2024" BOOLEAN,
    "source_book" VARCHAR(100),
    "content_version" VARCHAR(20) NOT NULL,
    "is_homebrew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_feature_choices" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "choice_name" VARCHAR(100) NOT NULL,
    "level" INTEGER NOT NULL,
    "choose_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "class_feature_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_feature_options" (
    "id" SERIAL NOT NULL,
    "choice_id" INTEGER NOT NULL,
    "option_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "mechanics" JSONB,

    CONSTRAINT "class_feature_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subclasses" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "source" VARCHAR(20),
    "page" INTEGER,
    "short_name" VARCHAR(50),
    "subclass_features" JSONB,
    "subclass_spells" JSONB,
    "content_version" VARCHAR(20) NOT NULL,
    "is_homebrew" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subclasses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subclass_features" (
    "id" SERIAL NOT NULL,
    "subclass_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "mechanics" JSONB,

    CONSTRAINT "subclass_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fighting_styles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "source" VARCHAR(20),
    "page" INTEGER,
    "description" TEXT,
    "mechanics" JSONB,
    "classes" TEXT[],
    "content_version" VARCHAR(20) NOT NULL,

    CONSTRAINT "fighting_styles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eldritch_invocations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "source" VARCHAR(20),
    "page" INTEGER,
    "prerequisites" JSONB,
    "description" TEXT,
    "mechanics" JSONB,
    "content_version" VARCHAR(20) NOT NULL,

    CONSTRAINT "eldritch_invocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divine_orders" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "mechanics" JSONB,
    "content_version" VARCHAR(20) NOT NULL,

    CONSTRAINT "divine_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feats_name_key" ON "feats"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subclasses_class_id_name_key" ON "subclasses"("class_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "fighting_styles_name_key" ON "fighting_styles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "eldritch_invocations_name_key" ON "eldritch_invocations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "divine_orders_name_key" ON "divine_orders"("name");

-- AddForeignKey
ALTER TABLE "class_feature_choices" ADD CONSTRAINT "class_feature_choices_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_feature_options" ADD CONSTRAINT "class_feature_options_choice_id_fkey" FOREIGN KEY ("choice_id") REFERENCES "class_feature_choices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subclasses" ADD CONSTRAINT "subclasses_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subclass_features" ADD CONSTRAINT "subclass_features_subclass_id_fkey" FOREIGN KEY ("subclass_id") REFERENCES "subclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
