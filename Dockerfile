FROM oven/bun AS build

WORKDIR /app

COPY bun.lockb .
COPY package.json .
COPY prisma ./prisma
COPY src ./src

RUN bun install

RUN bun add -D prisma
RUN bun prisma generate
RUN bun remove prisma

CMD ["bun", "run", "src/index.ts"]