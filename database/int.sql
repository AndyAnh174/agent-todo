CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "full_name" text,
  "email" text UNIQUE NOT NULL,
  "password" text,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "todos" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "user_id" uuid,
  "group_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "due_time" timestamptz,
  "is_completed" boolean DEFAULT false,
  "is_important" boolean DEFAULT false,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "groups" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "name" text,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "tags" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "name" text,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "todo_tag" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "todo_id" uuid,
  "tag_id" uuid,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

ALTER TABLE "todos" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "todos" ADD FOREIGN KEY ("group_id") REFERENCES "groups" ("id");

ALTER TABLE "todo_tag" ADD FOREIGN KEY ("todo_id") REFERENCES "todos" ("id");

ALTER TABLE "todo_tag" ADD FOREIGN KEY ("tag_id") REFERENCES "tags" ("id");