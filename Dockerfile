FROM oven/bun AS build

WORKDIR /app

COPY bun.lockb .
COPY package.json .

RUN bun add -D prisma

RUN bun install --frozen-lockfile

COPY prisma ./prisma

RUN bun prisma generate

RUN bun remove prisma

COPY src ./src

CMD ["bun", "run", "src/index.ts"]